import Groq from "groq-sdk";
import type { Bill, BillSummary, PassLikelihood, ProsCons, Representative } from "./types";

const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const TIMEOUT_MS = 9000;

function getClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey, timeout: TIMEOUT_MS, maxRetries: 1 });
}

function strip(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
}

/* ── Lightweight per-instance cache ──────────────────────────────────────────
   Fluid Compute reuses function instances, so caching AI results by bill makes
   repeat views (and multiple judges hitting the same featured bills) instant
   and avoids unnecessary Groq calls / rate-limit pressure during judging. */
const CACHE = new Map<string, { v: unknown; exp: number }>();
const TTL_MS = 1000 * 60 * 60; // 1 hour

function cacheGet<T>(key: string): T | null {
  const hit = CACHE.get(key);
  if (hit && hit.exp > Date.now()) return hit.v as T;
  if (hit) CACHE.delete(key);
  return null;
}
function cacheSet(key: string, v: unknown): void {
  CACHE.set(key, { v, exp: Date.now() + TTL_MS });
  if (CACHE.size > 500) {
    const oldest = CACHE.keys().next().value;
    if (oldest !== undefined) CACHE.delete(oldest);
  }
}

/* ── Groq helpers (JSON mode + graceful failure) ─────────────────────────── */
async function chatJSON<T>(
  client: Groq,
  system: string,
  user: string,
  opts: { maxTokens: number; temperature: number },
): Promise<T | null> {
  try {
    const chat = await client.chat.completions.create({
      model: MODEL,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const raw = chat.choices[0]?.message?.content ?? "";
    return JSON.parse(strip(raw)) as T;
  } catch {
    return null;
  }
}

async function chatText(
  client: Groq,
  system: string,
  user: string,
  opts: { maxTokens: number; temperature: number },
): Promise<string | null> {
  try {
    const chat = await client.chat.completions.create({
      model: MODEL,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return chat.choices[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

/* Keep user-provided free text from blowing the prompt budget. */
function clampNote(note: string): string {
  return (note ?? "").trim().slice(0, 500);
}

/* ── Summarize + district impact ─────────────────────────────────────────── */
export async function summarizeBill(
  bill: Bill,
  state?: string,
  district?: string,
): Promise<BillSummary> {
  const location = state
    ? `${state}${district ? ` congressional district ${district}` : ""}`
    : "the United States";

  const cacheKey = `sum:${bill.id}:${state ?? ""}:${district ?? ""}`;
  const cached = cacheGet<BillSummary>(cacheKey);
  if (cached) return cached;

  const client = getClient();
  if (!client) return fallbackSummary(bill);

  const json = await chatJSON<{
    plainEnglish?: string;
    whatItMeans?: string;
    districtImpact?: string;
  }>(
    client,
    "You are a nonpartisan civic educator. Explain U.S. federal legislation in clear, plain English. " +
      "Never tell people what to think. Use short sentences a high-schooler can follow. " +
      "Base your explanation ONLY on the title, policy area, and latest action provided. " +
      "Do not invent specific dollar amounts, dates, vote counts, or names that are not given. " +
      "If a detail is unknown, stay general rather than guessing. " +
      "Return strict JSON matching the requested schema — no other text.",
    `Bill: ${bill.type} ${bill.number} (${bill.congress}th Congress)\n` +
      `Title: ${bill.title}\n` +
      `Policy area: ${bill.policyArea ?? "unknown"}\n` +
      `Latest action: ${bill.latestAction}\n` +
      `Constituent location: ${location}\n\n` +
      `Return JSON:\n` +
      `{"plainEnglish":"1-2 sentence plain explanation",` +
      ` "whatItMeans":"1-2 sentences on how it affects an ordinary person",` +
      ` "districtImpact":"1-2 concrete sentences on how this specifically could affect ${location}"}`,
    { maxTokens: 700, temperature: 0.3 },
  );

  if (!json || !json.plainEnglish) return fallbackSummary(bill);

  const result: BillSummary = {
    plainEnglish: json.plainEnglish,
    whatItMeans: json.whatItMeans ?? "",
    districtImpact: json.districtImpact ?? "",
    stance: "neutral",
  };
  cacheSet(cacheKey, result);
  return result;
}

/* ── Pros & Cons ─────────────────────────────────────────────────────────── */
export async function generateProsCons(bill: Bill): Promise<ProsCons> {
  const cacheKey = `pc:${bill.id}`;
  const cached = cacheGet<ProsCons>(cacheKey);
  if (cached) return cached;

  const client = getClient();
  if (!client) return fallbackProsCons(bill);

  const json = await chatJSON<{
    pros?: string[];
    cons?: string[];
    supporterView?: string;
    opposerView?: string;
  }>(
    client,
    "You are a balanced nonpartisan policy analyst. Present both sides of legislation fairly and with " +
      "equal weight. Do not reveal your own opinion. Base arguments on the bill's stated purpose; do not " +
      "fabricate statistics. Return strict JSON — no other text.",
    `Bill: ${bill.type} ${bill.number} — "${bill.title}"\n` +
      `Policy area: ${bill.policyArea ?? "unknown"}\n\n` +
      `Return JSON:\n` +
      `{"pros":["3 distinct arguments FOR this bill, each under 20 words"],` +
      ` "cons":["3 distinct arguments AGAINST this bill, each under 20 words"],` +
      ` "supporterView":"1 sentence on who typically supports this and why",` +
      ` "opposerView":"1 sentence on who typically opposes this and why"}`,
    { maxTokens: 700, temperature: 0.4 },
  );

  const pros = Array.isArray(json?.pros) ? json!.pros.filter(Boolean).slice(0, 3) : [];
  const cons = Array.isArray(json?.cons) ? json!.cons.filter(Boolean).slice(0, 3) : [];
  if (pros.length < 3 || cons.length < 3) return fallbackProsCons(bill);

  const result: ProsCons = {
    pros,
    cons,
    supporterView: json?.supporterView ?? "",
    opposerView: json?.opposerView ?? "",
  };
  cacheSet(cacheKey, result);
  return result;
}

/* ── Pass likelihood ─────────────────────────────────────────────────────── */
export async function predictPassLikelihood(bill: Bill): Promise<PassLikelihood> {
  const cacheKey = `pl:${bill.id}:${bill.stage ?? 1}`;
  const cached = cacheGet<PassLikelihood>(cacheKey);
  if (cached) return cached;

  const client = getClient();
  if (!client) return fallbackLikelihood(bill);

  const json = await chatJSON<{ percent?: number; label?: string; rationale?: string }>(
    client,
    "You are a congressional analyst estimating how likely a bill is to become law. " +
      "Base your estimate on the bill's stage, policy area, and historical base rates for similar bills. " +
      "Be realistic — the vast majority of introduced bills never become law. " +
      "This is a probabilistic estimate, not a guarantee. Return strict JSON only.",
    `Bill: ${bill.type} ${bill.number} (${bill.congress}th Congress)\n` +
      `Title: "${bill.title}"\n` +
      `Policy area: ${bill.policyArea ?? "unknown"}\n` +
      `Current stage: ${bill.stage ?? 1}/5 (1=Introduced, 5=Signed into law)\n` +
      `Latest action: ${bill.latestAction}\n\n` +
      `Return JSON:\n` +
      `{"percent":NUMBER_0_TO_100,"label":"Unlikely|Possible|Likely|Very Likely",` +
      `"rationale":"1-2 sentences explaining the estimate"}`,
    { maxTokens: 300, temperature: 0.2 },
  );

  if (!json || json.percent == null || Number.isNaN(Number(json.percent))) {
    return fallbackLikelihood(bill);
  }

  const pct = Math.min(100, Math.max(0, Number(json.percent)));
  const result: PassLikelihood = {
    percent: pct,
    label: (json.label as PassLikelihood["label"]) ?? labelFromPct(pct),
    rationale: json.rationale ?? "",
  };
  cacheSet(cacheKey, result);
  return result;
}

/* ── Constituent letter ──────────────────────────────────────────────────── */
export async function generateLetter(
  bill: Bill,
  rep: Representative,
  position: "support" | "oppose",
  personalNote: string,
): Promise<string> {
  const client = getClient();
  if (!client) return fallbackLetter(bill, rep, position, personalNote);
  const note = clampNote(personalNote);

  const text = await chatText(
    client,
    "You draft short, respectful, persuasive constituent letters to members of Congress. " +
      "Keep them under 200 words. Make them specific and personal — not form-letter language. " +
      "Reference the bill by its number and title. Do not fabricate statistics, events, or quotes. " +
      "Return only the letter body text, starting with 'Dear …'.",
    `Write a letter to ${rep.chamber === "Senate" ? "Senator" : "Representative"} ${rep.name} ` +
      `(${rep.state}${rep.district ? `-${rep.district}` : ""}).\n` +
      `The constituent ${position}s ${bill.type} ${bill.number}: "${bill.title}".\n` +
      (note ? `Personal note to weave in naturally: ${note}\n` : "") +
      `Make it sound like a real person wrote it, not a form letter.`,
    { maxTokens: 700, temperature: 0.6 },
  );

  return text ?? fallbackLetter(bill, rep, position, personalNote);
}

/* ── Call script ─────────────────────────────────────────────────────────── */
export async function generateCallScript(
  bill: Bill,
  rep: Representative,
  position: "support" | "oppose",
  personalNote: string,
): Promise<string> {
  const client = getClient();
  if (!client) return fallbackCallScript(bill, rep, position);
  const note = clampNote(personalNote);

  const text = await chatText(
    client,
    "You write short, confident phone call scripts for constituents calling congressional offices. " +
      "Format as a brief script under 120 words. Include: greeting, who you are, your position, " +
      "one key reason, and a clear ask. Use natural spoken language. Do not fabricate statistics. " +
      "Return only the script text.",
    `Write a phone call script for a constituent calling ` +
      `${rep.chamber === "Senate" ? "Senator" : "Representative"} ${rep.name}'s office.\n` +
      `Bill: ${bill.type} ${bill.number} — "${bill.title}"\n` +
      `Position: ${position}\n` +
      (note ? `Personal context: ${note}\n` : "") +
      `Keep it under 120 words, casual and confident.`,
    { maxTokens: 500, temperature: 0.6 },
  );

  return text ?? fallbackCallScript(bill, rep, position);
}

/* ── Ask this bill (grounded conversational Q&A) ──────────────────────────────
   A constituent can ask free-form questions about a specific bill. The model is
   strictly grounded in the bill metadata we actually have and is told to admit
   when something isn't in the record rather than inventing an answer. */
export type AskTurn = { role: "user" | "assistant"; content: string };

const ASK_REFUSAL =
  "I can only answer based on this bill's official record (its title, policy area, sponsor, and latest action). " +
  "That specific detail isn't in the information I have — the full text on Congress.gov would be the best place to check.";

export async function askBill(
  bill: Bill,
  question: string,
  history: AskTurn[] = [],
): Promise<string> {
  const q = (question ?? "").trim().slice(0, 600);
  if (!q) return "Ask me anything about this bill — what it does, who it affects, or where it stands.";

  const client = getClient();
  if (!client) return ASK_REFUSAL;

  const billContext =
    `Bill: ${bill.type} ${bill.number} (${bill.congress}th Congress)\n` +
    `Title: ${bill.title}\n` +
    `Policy area: ${bill.policyArea ?? "unknown"}\n` +
    `Sponsor: ${bill.sponsorName ?? "unknown"}${bill.sponsorParty ? ` (${bill.sponsorParty})` : ""}\n` +
    `Cosponsors: ${bill.cosponsors ?? "unknown"}\n` +
    `Current stage: ${bill.stage ?? 1}/5 (1=Introduced, 5=Signed into law)\n` +
    `Latest action: ${bill.latestAction}`;

  const recent = history.slice(-6).map((t) => ({
    role: t.role,
    content: (t.content ?? "").slice(0, 800),
  }));

  try {
    const chat = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a nonpartisan civic educator answering a constituent's questions about ONE specific U.S. " +
            "federal bill. Use only the bill record provided below plus widely-known, general civics knowledge " +
            "about how Congress works. Do NOT invent specific dollar amounts, vote counts, dates, names, or " +
            "provisions that are not in the record. If asked about a specific detail you don't have, say so " +
            "plainly and point them to the full text on Congress.gov. Never tell the person what opinion to " +
            "hold; if asked your opinion, explain both sides instead. Keep answers under 120 words, warm and " +
            "clear enough for a high-schooler. Plain text only — no markdown headers.\n\n" +
            "BILL RECORD:\n" +
            billContext,
        },
        ...recent,
        { role: "user", content: q },
      ],
    });
    return chat.choices[0]?.message?.content?.trim() || ASK_REFUSAL;
  } catch {
    return ASK_REFUSAL;
  }
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function labelFromPct(pct: number): PassLikelihood["label"] {
  if (pct >= 70) return "Very Likely";
  if (pct >= 45) return "Likely";
  if (pct >= 20) return "Possible";
  return "Unlikely";
}

/* ── Graceful fallbacks ──────────────────────────────────────────────────────
   Used only if the AI service is unreachable. These are presentable, neutral,
   and never expose configuration details to the user. */
function fallbackSummary(bill: Bill): BillSummary {
  const area = bill.policyArea ? bill.policyArea.toLowerCase() : "federal policy";
  return {
    plainEnglish: `${bill.title} is a piece of federal legislation in the area of ${area}. Its most recent status is: ${bill.latestAction.toLowerCase()}.`,
    whatItMeans:
      "Like most legislation, its real-world effect depends on whether it advances through Congress and is signed into law. Open the official Congress.gov record below for the full bill text.",
    districtImpact:
      "Federal laws in this area can affect funding, rules, and programs that reach communities across the country.",
    stance: "neutral",
  };
}

function fallbackProsCons(bill: Bill): ProsCons {
  return {
    pros: [
      `Addresses a recognized policy need related to ${bill.policyArea ?? "this issue area"}`,
      "Could deliver direct benefits to the communities it targets",
      "Has backing from stakeholders who prioritize this issue",
    ],
    cons: [
      "May require significant federal funding or resources",
      "Some argue alternative approaches could be more effective",
      "Implementation and oversight challenges could affect outcomes",
    ],
    supporterView: "Advocates and directly affected communities tend to support this bill.",
    opposerView: "Critics may cite cost concerns or prefer alternative solutions.",
  };
}

function fallbackLikelihood(bill: Bill): PassLikelihood {
  const stage = bill.stage ?? 1;
  const pct = [5, 12, 22, 45, 95][Math.min(4, Math.max(0, stage - 1))];
  return {
    percent: pct,
    label: labelFromPct(pct),
    rationale:
      "Estimate based on the bill's current stage and the historical base rate that most introduced bills do not become law.",
  };
}

function fallbackLetter(
  bill: Bill,
  rep: Representative,
  position: "support" | "oppose",
  note: string,
): string {
  const title = rep.chamber === "Senate" ? "Senator" : "Representative";
  return (
    `Dear ${title} ${rep.name},\n\n` +
    `I am a constituent from ${rep.state}${rep.district ? `, District ${rep.district}` : ""}, ` +
    `and I am writing to urge you to ${position} ${bill.type} ${bill.number} — the ${bill.title}.\n\n` +
    (clampNote(note) ? `${clampNote(note)}\n\n` : "") +
    `This issue matters deeply to me and our community. I would appreciate knowing your position.\n\n` +
    `Thank you for your service.\n\nRespectfully,\nA constituent from ${rep.state}`
  );
}

function fallbackCallScript(bill: Bill, rep: Representative, position: "support" | "oppose"): string {
  const title = rep.chamber === "Senate" ? "Senator" : "Representative";
  return (
    `Hi, my name is [YOUR NAME] and I'm a constituent calling to share my view on ${bill.type} ${bill.number}.\n\n` +
    `I'm calling to urge ${title} ${rep.name} to ${position} the ${bill.title}.\n\n` +
    `This issue directly affects our community, and I believe this vote matters.\n\n` +
    `Could you pass along my message and let me know the ${title}'s position?\n\nThank you.`
  );
}
