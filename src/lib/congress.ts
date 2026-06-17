import type { Bill, BillStage, BillVote, MemberDetail, VoteCast } from "./types";
import { ISSUE_TOPICS } from "./issues";

const API_BASE = "https://api.congress.gov/v3";

/* ── Roll-call votes ──────────────────────────────────────────────────────────
   Closes the accountability loop: given a bill and a set of representatives,
   find the recorded House roll-call vote and report how each rep actually voted.
   Senate per-member votes are not exposed by the Congress.gov API, so those
   degrade gracefully to a result + link-out. */

interface RecordedVote {
  chamber?: string;
  congress?: number;
  rollNumber?: number;
  sessionNumber?: number;
  date?: string;
  url?: string;
}

interface MemberVoteRow {
  bioguideID?: string;
  voteCast?: string;
}

function normalizeVote(v?: string): VoteCast {
  const s = (v ?? "").toLowerCase();
  if (s === "yea" || s === "aye" || s === "yes") return "Yea";
  if (s === "nay" || s === "no") return "Nay";
  if (s === "present") return "Present";
  return "Not Voting";
}

/** Fetch how a member voted on a specific House roll call, plus chamber totals. */
async function fetchHouseRollCall(
  apiKey: string,
  congress: number,
  session: number,
  roll: number,
  bioguideIds: string[],
): Promise<{ totals: BillVote["totals"]; repVotes: Record<string, VoteCast>; result?: string } | null> {
  const url =
    `${API_BASE}/house-vote/${congress}/${session}/${roll}/members` +
    `?api_key=${apiKey}&format=json`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    houseRollCallVoteMemberVotes?: { result?: string; results?: MemberVoteRow[] };
  };
  const block = data.houseRollCallVoteMemberVotes;
  const rows = block?.results ?? [];
  if (rows.length === 0) return null;

  const totals = { yea: 0, nay: 0, present: 0, notVoting: 0 };
  const wanted = new Set(bioguideIds);
  const repVotes: Record<string, VoteCast> = {};

  for (const row of rows) {
    const v = normalizeVote(row.voteCast);
    if (v === "Yea") totals.yea++;
    else if (v === "Nay") totals.nay++;
    else if (v === "Present") totals.present++;
    else totals.notVoting++;
    if (row.bioguideID && wanted.has(row.bioguideID)) {
      repVotes[row.bioguideID] = v;
    }
  }
  return { totals, repVotes, result: block?.result };
}

/**
 * Get the most relevant recorded vote for a bill and how the given reps voted.
 * Returns null if the bill has no recorded roll-call vote yet.
 */
export async function getBillVote(
  congress: number,
  billType: string,
  billNumber: string,
  bioguideIds: string[],
): Promise<BillVote | null> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return null;

  try {
    const actionsUrl =
      `${API_BASE}/bill/${congress}/${billType.toLowerCase()}/${billNumber}/actions` +
      `?api_key=${apiKey}&format=json&limit=250`;
    const res = await fetch(actionsUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      actions?: Array<{ recordedVotes?: RecordedVote[] }>;
    };

    // Collect every recorded vote across all actions.
    const votes: RecordedVote[] = [];
    for (const a of data.actions ?? []) {
      for (const rv of a.recordedVotes ?? []) votes.push(rv);
    }
    if (votes.length === 0) return null;

    // Prefer the most recent House vote (we have per-member data for House).
    const houseVotes = votes
      .filter((v) => (v.chamber ?? "").toLowerCase() === "house" && v.rollNumber != null)
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());

    if (houseVotes.length > 0) {
      const hv = houseVotes[0];
      const detail = await fetchHouseRollCall(
        apiKey,
        hv.congress ?? congress,
        hv.sessionNumber ?? 1,
        hv.rollNumber!,
        bioguideIds,
      );
      if (!detail) return null;
      return {
        chamber: "House",
        congress: hv.congress ?? congress,
        rollNumber: hv.rollNumber!,
        sessionNumber: hv.sessionNumber ?? 1,
        date: hv.date ?? "",
        result: detail.result ?? "",
        sourceUrl: hv.url ?? "",
        memberVotesAvailable: true,
        totals: detail.totals,
        repVotes: detail.repVotes,
      };
    }

    // Only Senate vote(s) exist — no per-member data available via the API.
    const sv = votes
      .filter((v) => (v.chamber ?? "").toLowerCase() === "senate" && v.rollNumber != null)
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())[0];
    if (sv) {
      return {
        chamber: "Senate",
        congress: sv.congress ?? congress,
        rollNumber: sv.rollNumber!,
        sessionNumber: sv.sessionNumber ?? 1,
        date: sv.date ?? "",
        result: "",
        sourceUrl: sv.url ?? "",
        memberVotesAvailable: false,
        totals: { yea: 0, nay: 0, present: 0, notVoting: 0 },
        repVotes: {},
      };
    }
    return null;
  } catch {
    return null;
  }
}

interface CongressApiBill {
  congress: number;
  type: string;
  number: string;
  title: string;
  policyArea?: { name: string };
  latestAction?: { actionDate: string; text: string };
  url: string;
  sponsors?: Array<{ bioguideId: string; fullName: string; party: string }>;
  cosponsors?: number;
  introducedDate?: string;
}

/* ── Infer legislative stage from action text ────────────────────────────── */
export function inferStage(latestAction: string): BillStage {
  const a = latestAction.toLowerCase();
  if (a.includes("became public law") || a.includes("signed by president") || a.includes("enacted")) return 5;
  if (a.includes("passed senate") || a.includes("passed house") || a.includes("agreed to in senate") || a.includes("agreed to in house")) return 4;
  if (a.includes("placed on") || a.includes("scheduled") || a.includes("rules committee") || a.includes("reported by the committee")) return 3;
  if (a.includes("committee") || a.includes("referred") || a.includes("subcommittee") || a.includes("markup") || a.includes("ordered to be reported")) return 2;
  return 1;
}

/* ── Infer urgency ───────────────────────────────────────────────────────── */
function inferUrgency(latestActionDate: string, latestAction: string): Bill["urgency"] {
  const a = latestAction.toLowerCase();
  if (a.includes("passed") || a.includes("scheduled") || a.includes("floor")) return "urgent";
  if (!latestActionDate) return "active";
  const days = (Date.now() - new Date(latestActionDate).getTime()) / 86_400_000;
  if (days < 14) return "new";
  return "active";
}

function matchIssues(bill: { title: string; policyArea?: string }, issueIds: string[]): string[] {
  const haystack = `${bill.title} ${bill.policyArea ?? ""}`.toLowerCase();
  return issueIds.filter((id) => {
    const topic = ISSUE_TOPICS.find((t) => t.id === id);
    if (!topic) return false;
    return topic.keywords.some((kw) => haystack.includes(kw.toLowerCase()));
  });
}

/* ── Convert raw API bill to local Bill shape ────────────────────────────── */
function apiBillToLocal(b: CongressApiBill): Bill {
  const latestAction = b.latestAction?.text ?? "No recorded action";
  const latestActionDate = b.latestAction?.actionDate ?? "";
  return {
    id: `${b.type}${b.number}-${b.congress}`,
    congress: b.congress,
    type: b.type,
    number: b.number,
    title: b.title,
    latestAction,
    latestActionDate,
    url: b.url?.replace("api.congress.gov/v3", "www.congress.gov") ?? "https://www.congress.gov",
    policyArea: b.policyArea?.name,
    matchedIssues: [],
    stage: inferStage(latestAction),
    urgency: inferUrgency(latestActionDate, latestAction),
    sponsorName: b.sponsors?.[0]?.fullName,
    sponsorParty: b.sponsors?.[0]?.party,
    cosponsors: typeof b.cosponsors === "number" ? b.cosponsors : undefined,
    introducedDate: b.introducedDate,
  };
}

async function fetchFromApi(apiKey: string): Promise<Bill[]> {
  const url = `${API_BASE}/bill?api_key=${apiKey}&limit=40&sort=updateDate+desc&format=json`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Congress API ${res.status}`);
  const data = (await res.json()) as { bills: CongressApiBill[] };
  return data.bills.map(apiBillToLocal);
}

export async function getRelevantBills(issueIds: string[]): Promise<{ bills: Bill[]; live: boolean }> {
  const apiKey = process.env.CONGRESS_API_KEY;
  let pool: Bill[];
  let live = false;

  if (apiKey) {
    try {
      pool = await fetchFromApi(apiKey);
      live = true;
    } catch {
      pool = MOCK_BILLS;
    }
  } else {
    pool = MOCK_BILLS;
  }

  // If no issues requested, return the full pool (bills browser mode)
  if (issueIds.length === 0) {
    return { bills: pool.slice(0, 20), live };
  }

  const matched = pool
    .map((b) => ({ ...b, matchedIssues: matchIssues(b, issueIds) }))
    .filter((b) => b.matchedIssues.length > 0);

  const result = matched.length > 0 ? matched : pool.slice(0, 8);
  return { bills: result.slice(0, 12), live };
}

/* ── Full-text search via Congress.gov ───────────────────────────────────── */
export async function searchBills(
  query: string,
  limit = 20,
): Promise<{ bills: Bill[]; live: boolean }> {
  const apiKey = process.env.CONGRESS_API_KEY;
  const q = query.trim();

  if (!apiKey || !q) {
    return {
      bills: MOCK_BILLS.filter((b) =>
        b.title.toLowerCase().includes(q.toLowerCase()) ||
        (b.policyArea ?? "").toLowerCase().includes(q.toLowerCase()),
      ).slice(0, limit),
      live: false,
    };
  }

  try {
    const encoded = encodeURIComponent(q);
    const url = `${API_BASE}/bill?api_key=${apiKey}&query=${encoded}&limit=${Math.min(limit, 40)}&sort=score+desc&format=json`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) throw new Error(`Congress API ${res.status}`);
    const data = (await res.json()) as { bills: CongressApiBill[] };
    return { bills: (data.bills ?? []).map(apiBillToLocal), live: true };
  } catch {
    // Client-side fallback
    return {
      bills: MOCK_BILLS.filter((b) =>
        b.title.toLowerCase().includes(q.toLowerCase()) ||
        (b.policyArea ?? "").toLowerCase().includes(q.toLowerCase()),
      ).slice(0, limit),
      live: false,
    };
  }
}

/* ── Get member profile + recent sponsored legislation ───────────────────── */
export async function getMemberDetail(bioguideId: string): Promise<MemberDetail | null> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return null;

  try {
    const [memberRes, billsRes] = await Promise.allSettled([
      fetch(`${API_BASE}/member/${bioguideId}?api_key=${apiKey}&format=json`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 }, // cache for 1 hour
      }),
      fetch(
        `${API_BASE}/member/${bioguideId}/sponsored-legislation?api_key=${apiKey}&format=json&limit=6`,
        {
          headers: { Accept: "application/json" },
          next: { revalidate: 3600 },
        },
      ),
    ]);

    if (memberRes.status !== "fulfilled" || !memberRes.value.ok) return null;
    const memberData = await memberRes.value.json();
    const m = memberData.member;
    if (!m) return null;

    let recentBills: Bill[] = [];
    let sponsoredCount = 0;
    if (billsRes.status === "fulfilled" && billsRes.value.ok) {
      const billsData = await billsRes.value.json();
      const raw: CongressApiBill[] = billsData.sponsoredLegislation ?? [];
      recentBills = raw.slice(0, 6).map(apiBillToLocal);
      sponsoredCount = billsData.pagination?.count ?? raw.length;
    }

    // Determine party abbreviation from history
    const partyHistory: Array<{ partyAbbreviation: string }> = m.partyHistory ?? [];
    const latestParty = partyHistory[partyHistory.length - 1];
    const party =
      latestParty?.partyAbbreviation ??
      (m.partyName === "Republican" ? "R" : m.partyName === "Democrat" ? "D" : "I");

    // Get district from most recent term
    const terms: Array<{ chamber?: string; district?: number; startYear?: number }> =
      Array.isArray(m.terms) ? m.terms : (m.terms?.item ?? []);
    const lastTerm = terms[terms.length - 1];

    return {
      bioguideId,
      name: m.directOrderName ?? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim(),
      party,
      state: m.state ?? "",
      district: lastTerm?.district != null ? String(lastTerm.district) : undefined,
      photoUrl: m.depiction?.imageUrl,
      website: m.officialWebsiteUrl,
      sponsoredCount,
      recentBills,
    };
  } catch {
    return null;
  }
}

export const MOCK_BILLS: Bill[] = [
  {
    id: "hr1234-119", congress: 119, type: "HR", number: "1234",
    title: "Affordable Housing Expansion Act",
    latestAction: "Referred to the Committee on Financial Services.",
    latestActionDate: "2026-04-12", url: "https://www.congress.gov",
    policyArea: "Housing and Community Development", matchedIssues: [],
    stage: 2, urgency: "active",
    sponsorName: "Rep. Alexandria Ocasio-Cortez", sponsorParty: "D", cosponsors: 28,
    introducedDate: "2026-04-01",
  },
  {
    id: "s567-119", congress: 119, type: "S", number: "567",
    title: "Clean Water Infrastructure Investment Act",
    latestAction: "Passed Senate with amendments by Yea-Nay vote.",
    latestActionDate: "2026-05-02", url: "https://www.congress.gov",
    policyArea: "Environmental Protection", matchedIssues: [],
    stage: 4, urgency: "urgent",
    sponsorName: "Sen. Amy Klobuchar", sponsorParty: "D", cosponsors: 41,
    introducedDate: "2026-03-10",
  },
  {
    id: "hr890-119", congress: 119, type: "HR", number: "890",
    title: "Student Loan Interest Relief Act",
    latestAction: "Reported by the Committee on Education and the Workforce.",
    latestActionDate: "2026-03-28", url: "https://www.congress.gov",
    policyArea: "Education", matchedIssues: [],
    stage: 3, urgency: "active",
    sponsorName: "Rep. Bobby Scott", sponsorParty: "D", cosponsors: 15,
    introducedDate: "2026-02-14",
  },
  {
    id: "hr2100-119", congress: 119, type: "HR", number: "2100",
    title: "Mental Health Access for Students Act",
    latestAction: "Referred to the Subcommittee on Health.",
    latestActionDate: "2026-05-20", url: "https://www.congress.gov",
    policyArea: "Health", matchedIssues: [],
    stage: 2, urgency: "new",
    sponsorName: "Rep. Grace Meng", sponsorParty: "D", cosponsors: 9,
    introducedDate: "2026-05-12",
  },
  {
    id: "s1450-119", congress: 119, type: "S", number: "1450",
    title: "Artificial Intelligence Data Privacy Act",
    latestAction: "Read twice and referred to the Committee on Commerce.",
    latestActionDate: "2026-05-28", url: "https://www.congress.gov",
    policyArea: "Science, Technology, Communications", matchedIssues: [],
    stage: 2, urgency: "new",
    sponsorName: "Sen. Maria Cantwell", sponsorParty: "D", cosponsors: 6,
    introducedDate: "2026-05-20",
  },
  {
    id: "hr3300-119", congress: 119, type: "HR", number: "3300",
    title: "Small Business Tax Fairness Act",
    latestAction: "Placed on the Union Calendar.",
    latestActionDate: "2026-05-08", url: "https://www.congress.gov",
    policyArea: "Taxation", matchedIssues: [],
    stage: 3, urgency: "urgent",
    sponsorName: "Rep. Kevin Brady", sponsorParty: "R", cosponsors: 34,
    introducedDate: "2026-03-22",
  },
  {
    id: "hr775-119", congress: 119, type: "HR", number: "775",
    title: "Veterans Mental Health Care Improvement Act",
    latestAction: "Passed House by voice vote.",
    latestActionDate: "2026-04-19", url: "https://www.congress.gov",
    policyArea: "Armed Forces and National Security", matchedIssues: [],
    stage: 4, urgency: "urgent",
    sponsorName: "Rep. Mark Takano", sponsorParty: "D", cosponsors: 72,
    introducedDate: "2026-02-01",
  },
  {
    id: "hr4040-119", congress: 119, type: "HR", number: "4040",
    title: "Community Wildfire Smoke Protection Act",
    latestAction: "Referred to the Committee on Natural Resources.",
    latestActionDate: "2026-05-20", url: "https://www.congress.gov",
    policyArea: "Environmental Protection", matchedIssues: [],
    stage: 2, urgency: "new",
    sponsorName: "Rep. Kim Schrier", sponsorParty: "D", cosponsors: 12,
    introducedDate: "2026-05-15",
  },
];
