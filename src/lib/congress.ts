import type { Bill, BillStage } from "./types";
import { ISSUE_TOPICS } from "./issues";

const API_BASE = "https://api.congress.gov/v3";

interface CongressApiBill {
  congress: number;
  type: string;
  number: string;
  title: string;
  policyArea?: { name: string };
  latestAction?: { actionDate: string; text: string };
  url: string;
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

async function fetchFromApi(apiKey: string): Promise<Bill[]> {
  const url = `${API_BASE}/bill?api_key=${apiKey}&limit=40&sort=updateDate+desc`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Congress API ${res.status}`);
  const data = (await res.json()) as { bills: CongressApiBill[] };

  return data.bills.map((b) => {
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
    };
  });
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

  const matched = pool
    .map((b) => ({ ...b, matchedIssues: matchIssues(b, issueIds) }))
    .filter((b) => b.matchedIssues.length > 0);

  const result = matched.length > 0 ? matched : pool.slice(0, 8);
  return { bills: result.slice(0, 12), live };
}

export const MOCK_BILLS: Bill[] = [
  {
    id: "hr1234-119", congress: 119, type: "HR", number: "1234",
    title: "Affordable Housing Expansion Act",
    latestAction: "Referred to the Committee on Financial Services.",
    latestActionDate: "2026-04-12", url: "https://www.congress.gov",
    policyArea: "Housing and Community Development", matchedIssues: [],
    stage: 2, urgency: "active",
  },
  {
    id: "s567-119", congress: 119, type: "S", number: "567",
    title: "Clean Water Infrastructure Investment Act",
    latestAction: "Passed Senate with amendments by Yea-Nay vote.",
    latestActionDate: "2026-05-02", url: "https://www.congress.gov",
    policyArea: "Environmental Protection", matchedIssues: [],
    stage: 4, urgency: "urgent",
  },
  {
    id: "hr890-119", congress: 119, type: "HR", number: "890",
    title: "Student Loan Interest Relief Act",
    latestAction: "Reported by the Committee on Education and the Workforce.",
    latestActionDate: "2026-03-28", url: "https://www.congress.gov",
    policyArea: "Education", matchedIssues: [],
    stage: 3, urgency: "active",
  },
  {
    id: "hr2100-119", congress: 119, type: "HR", number: "2100",
    title: "Mental Health Access for Students Act",
    latestAction: "Referred to the Subcommittee on Health.",
    latestActionDate: "2026-05-20", url: "https://www.congress.gov",
    policyArea: "Health", matchedIssues: [],
    stage: 2, urgency: "new",
  },
  {
    id: "s1450-119", congress: 119, type: "S", number: "1450",
    title: "Artificial Intelligence Data Privacy Act",
    latestAction: "Read twice and referred to the Committee on Commerce.",
    latestActionDate: "2026-05-28", url: "https://www.congress.gov",
    policyArea: "Science, Technology, Communications", matchedIssues: [],
    stage: 2, urgency: "new",
  },
  {
    id: "hr3300-119", congress: 119, type: "HR", number: "3300",
    title: "Small Business Tax Fairness Act",
    latestAction: "Placed on the Union Calendar.",
    latestActionDate: "2026-05-08", url: "https://www.congress.gov",
    policyArea: "Taxation", matchedIssues: [],
    stage: 3, urgency: "urgent",
  },
  {
    id: "hr775-119", congress: 119, type: "HR", number: "775",
    title: "Veterans Mental Health Care Improvement Act",
    latestAction: "Passed House by voice vote.",
    latestActionDate: "2026-04-19", url: "https://www.congress.gov",
    policyArea: "Armed Forces and National Security", matchedIssues: [],
    stage: 4, urgency: "urgent",
  },
  {
    id: "hr4040-119", congress: 119, type: "HR", number: "4040",
    title: "Community Wildfire Smoke Protection Act",
    latestAction: "Referred to the Committee on Natural Resources.",
    latestActionDate: "2026-05-20", url: "https://www.congress.gov",
    policyArea: "Environmental Protection", matchedIssues: [],
    stage: 2, urgency: "new",
  },
];
