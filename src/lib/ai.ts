import Groq from "groq-sdk";
import type { Bill, BillSummary, PassLikelihood, ProsCons, Representative } from "./types";

const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

function getClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

function strip(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
}

/* ── Summarize + district impact ─────────────────────────────────────────── */
export async function summarizeBill(
  bill: Bill,
  state?: string,
  district?: string,
): Promise<BillSummary> {
  const client = getClient();
  if (!client) return mockSummary(bill);

  const location = state
    ? `${state}${district ? ` congressional district ${district}` : ""}`
    : "the United States";

  const chat = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You are a nonpartisan civic educator. Explain U.S. federal legislation in clear, plain English. " +
          "Never tell people what to think. Use short sentences a high-schooler can follow. " +
          "Return strict JSON matching the requested schema — no other text.",
      },
      {
        role: "user",
        content:
          `Bill: ${bill.type} ${bill.number} (${bill.congress}th Congress)\n` +
          `Title: ${bill.title}\n` +
          `Policy area: ${bill.policyArea ?? "unknown"}\n` +
          `Latest action: ${bill.latestAction}\n` +
          `Constituent location: ${location}\n\n` +
          `Return JSON:\n` +
          `{"plainEnglish":"1-2 sentence plain explanation",` +
          ` "whatItMeans":"1-2 sentences on how it affects an ordinary person",` +
          ` "districtImpact":"1-2 concrete sentences on how this specifically could affect ${location}",` +
          ` "stance":"neutral"}`,
      },
    ],
  });

  try {
    const json = JSON.parse(strip(chat.choices[0]?.message?.content ?? ""));
    return { plainEnglish: json.plainEnglish ?? "", whatItMeans: json.whatItMeans ?? "",
      districtImpact: json.districtImpact ?? "", stance: "neutral" };
  } catch { return mockSummary(bill); }
}

/* ── Pros & Cons ─────────────────────────────────────────────────────────── */
export async function generateProsCons(bill: Bill): Promise<ProsCons> {
  const client = getClient();
  if (!client) return mockProsCons(bill);

  const chat = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You are a balanced nonpartisan policy analyst. Present both sides of legislation fairly. " +
          "Return strict JSON — no other text.",
      },
      {
        role: "user",
        content:
          `Bill: ${bill.type} ${bill.number} — "${bill.title}"\n` +
          `Policy area: ${bill.policyArea ?? "unknown"}\n\n` +
          `Return JSON:\n` +
          `{"pros":["3 distinct arguments FOR this bill, each under 20 words"],` +
          ` "cons":["3 distinct arguments AGAINST this bill, each under 20 words"],` +
          ` "supporterView":"1 sentence on who typically supports this and why",` +
          ` "opposerView":"1 sentence on who typically opposes this and why"}`,
      },
    ],
  });

  try {
    const json = JSON.parse(strip(chat.choices[0]?.message?.content ?? ""));
    return {
      pros: Array.isArray(json.pros) ? json.pros.slice(0, 3) : [],
      cons: Array.isArray(json.cons) ? json.cons.slice(0, 3) : [],
      supporterView: json.supporterView ?? "",
      opposerView: json.opposerView ?? "",
    };
  } catch { return mockProsCons(bill); }
}

/* ── Pass likelihood ─────────────────────────────────────────────────────── */
export async function predictPassLikelihood(bill: Bill): Promise<PassLikelihood> {
  const client = getClient();
  if (!client) return mockLikelihood(bill);

  const chat = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You are a congressional analyst estimating how likely a bill is to become law. " +
          "Base your estimate on the bill's stage, policy area, historical passage rates, and political context. " +
          "Be realistic — most bills never become law. Return strict JSON only.",
      },
      {
        role: "user",
        content:
          `Bill: ${bill.type} ${bill.number} (${bill.congress}th Congress)\n` +
          `Title: "${bill.title}"\n` +
          `Policy area: ${bill.policyArea ?? "unknown"}\n` +
          `Current stage: ${bill.stage ?? 1}/5 (1=Introduced, 5=Signed into law)\n` +
          `Latest action: ${bill.latestAction}\n\n` +
          `Return JSON:\n` +
          `{"percent":NUMBER_0_TO_100,"label":"Unlikely|Possible|Likely|Very Likely","rationale":"1-2 sentences"}`,
      },
    ],
  });

  try {
    const json = JSON.parse(strip(chat.choices[0]?.message?.content ?? ""));
    const pct = Math.min(100, Math.max(0, Number(json.percent) || 0));
    return { percent: pct, label: json.label ?? labelFromPct(pct), rationale: json.rationale ?? "" };
  } catch { return mockLikelihood(bill); }
}

/* ── Constituent letter ──────────────────────────────────────────────────── */
export async function generateLetter(
  bill: Bill, rep: Representative,
  position: "support" | "oppose", personalNote: string,
): Promise<string> {
  const client = getClient();
  if (!client) return mockLetter(bill, rep, position, personalNote);

  const chat = await client.chat.completions.create({
    model: MODEL, max_tokens: 700,
    messages: [
      { role: "system", content:
        "You draft short, respectful, persuasive constituent letters to members of Congress. " +
        "Keep them under 200 words. Make them specific and personal — not form-letter language. " +
        "Return only the letter body text, starting with 'Dear …'." },
      { role: "user", content:
        `Write a letter to ${rep.chamber === "Senate" ? "Senator" : "Representative"} ${rep.name} ` +
        `(${rep.state}${rep.district ? `-${rep.district}` : ""}).\n` +
        `The constituent ${position}s ${bill.type} ${bill.number}: "${bill.title}".\n` +
        (personalNote ? `Personal note to weave in naturally: ${personalNote}\n` : "") +
        `Make it sound like a real person wrote it, not a form letter.` },
    ],
  });

  return chat.choices[0]?.message?.content?.trim() ?? mockLetter(bill, rep, position, personalNote);
}

/* ── Call script ─────────────────────────────────────────────────────────── */
export async function generateCallScript(
  bill: Bill, rep: Representative,
  position: "support" | "oppose", personalNote: string,
): Promise<string> {
  const client = getClient();
  if (!client) return mockCallScript(bill, rep, position);

  const chat = await client.chat.completions.create({
    model: MODEL, max_tokens: 500,
    messages: [
      { role: "system", content:
        "You write short, confident phone call scripts for constituents calling congressional offices. " +
        "Format as a brief script under 120 words. Include: greeting, who you are, your position, " +
        "one key reason, and a clear ask. Use natural spoken language. Return only the script text." },
      { role: "user", content:
        `Write a phone call script for a constituent calling ` +
        `${rep.chamber === "Senate" ? "Senator" : "Representative"} ${rep.name}'s office.\n` +
        `Bill: ${bill.type} ${bill.number} — "${bill.title}"\n` +
        `Position: ${position}\n` +
        (personalNote ? `Personal context: ${personalNote}\n` : "") +
        `Keep it under 120 words, casual and confident.` },
    ],
  });

  return chat.choices[0]?.message?.content?.trim() ?? mockCallScript(bill, rep, position);
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function labelFromPct(pct: number): PassLikelihood["label"] {
  if (pct >= 70) return "Very Likely";
  if (pct >= 45) return "Likely";
  if (pct >= 20) return "Possible";
  return "Unlikely";
}

/* ── Mocks ───────────────────────────────────────────────────────────────── */
function mockSummary(bill: Bill): BillSummary {
  return {
    plainEnglish: `${bill.title} is a proposed federal law currently at: ${bill.latestAction.toLowerCase()}.`,
    whatItMeans: "Add a GROQ_API_KEY to .env.local for a full AI-written explanation.",
    districtImpact: "Add a GROQ_API_KEY to .env.local for a district-specific impact analysis.",
    stance: "neutral",
  };
}

function mockProsCons(bill: Bill): ProsCons {
  return {
    pros: [`Addresses a key policy need related to ${bill.policyArea ?? "this area"}`,
           "May provide direct benefits to affected communities",
           "Has support from stakeholders who prioritize this issue"],
    cons: ["May require significant federal funding or resources",
           "Some argue alternative approaches could be more effective",
           "Implementation challenges may affect outcomes"],
    supporterView: "Advocates and affected communities tend to support this bill.",
    opposerView: "Critics may cite cost concerns or prefer alternative solutions.",
  };
}

function mockLikelihood(bill: Bill): PassLikelihood {
  const stage = bill.stage ?? 1;
  const pct = [5, 12, 22, 45, 95][stage - 1];
  return { percent: pct, label: labelFromPct(pct), rationale: "Add a GROQ_API_KEY for AI-powered likelihood analysis." };
}

function mockLetter(bill: Bill, rep: Representative, position: "support" | "oppose", note: string): string {
  const title = rep.chamber === "Senate" ? "Senator" : "Representative";
  return (
    `Dear ${title} ${rep.name},\n\n` +
    `I am a constituent from ${rep.state}${rep.district ? `, District ${rep.district}` : ""}, ` +
    `and I am writing to urge you to ${position} ${bill.type} ${bill.number} — the ${bill.title}.\n\n` +
    (note ? `${note}\n\n` : "") +
    `This issue matters deeply to me and our community. I would appreciate knowing your position.\n\n` +
    `Thank you for your service.\n\nRespectfully,\nA constituent from ${rep.state}`
  );
}

function mockCallScript(bill: Bill, rep: Representative, position: "support" | "oppose"): string {
  const title = rep.chamber === "Senate" ? "Senator" : "Representative";
  return (
    `Hi, my name is [YOUR NAME] and I'm a constituent calling to share my view on ${bill.type} ${bill.number}.\n\n` +
    `I'm calling to urge ${title} ${rep.name} to ${position} the ${bill.title}.\n\n` +
    `This issue directly affects our community, and I believe this vote matters.\n\n` +
    `Could you pass along my message and let me know the ${title}'s position?\n\nThank you.`
  );
}
