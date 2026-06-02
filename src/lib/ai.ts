import Groq from "groq-sdk";
import type { Bill, BillSummary, Representative } from "./types";

const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

function getClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

/* ── Summarize bill ──────────────────────────────────────────────────────── */
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
          `Return JSON with exactly these keys:\n` +
          `{"plainEnglish": "1-2 sentence plain explanation of what the bill does",` +
          ` "whatItMeans": "1-2 sentences on how it affects an ordinary person",` +
          ` "districtImpact": "1-2 sentences on how this specifically could affect ${location} — be concrete",` +
          ` "stance": "neutral"}`,
      },
    ],
  });

  return parseSummary(chat.choices[0]?.message?.content ?? "", bill);
}

/* ── Generate constituent letter ─────────────────────────────────────────── */
export async function generateLetter(
  bill: Bill,
  rep: Representative,
  position: "support" | "oppose",
  personalNote: string,
): Promise<string> {
  const client = getClient();
  if (!client) return mockLetter(bill, rep, position, personalNote);

  const chat = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You draft short, respectful, persuasive constituent letters to members of Congress. " +
          "Keep them under 200 words. Make them specific and personal — not form-letter language. " +
          "Return only the letter body text, starting with 'Dear …'.",
      },
      {
        role: "user",
        content:
          `Write a letter to ${rep.chamber === "Senate" ? "Senator" : "Representative"} ${rep.name} ` +
          `(${rep.state}${rep.district ? `-${rep.district}` : ""}).\n` +
          `The constituent ${position}s ${bill.type} ${bill.number}: "${bill.title}".\n` +
          (personalNote ? `Personal note to weave in naturally: ${personalNote}\n` : "") +
          `Make it sound like a real person wrote it, not a form letter.`,
      },
    ],
  });

  return chat.choices[0]?.message?.content?.trim() ?? mockLetter(bill, rep, position, personalNote);
}

/* ── Generate phone call script ──────────────────────────────────────────── */
export async function generateCallScript(
  bill: Bill,
  rep: Representative,
  position: "support" | "oppose",
  personalNote: string,
): Promise<string> {
  const client = getClient();
  if (!client) return mockCallScript(bill, rep, position);

  const chat = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content:
          "You write short, confident phone call scripts for constituents calling their congressional representatives. " +
          "Format as a brief script under 120 words. Include: greeting, who you are, your position, one key reason, and a clear ask. " +
          "Use natural spoken language. Return only the script text.",
      },
      {
        role: "user",
        content:
          `Write a phone call script for a constituent calling ${rep.chamber === "Senate" ? "Senator" : "Representative"} ${rep.name}'s office.\n` +
          `Bill: ${bill.type} ${bill.number} — "${bill.title}"\n` +
          `Position: ${position}\n` +
          (personalNote ? `Personal context: ${personalNote}\n` : "") +
          `Keep it under 120 words, casual and confident.`,
      },
    ],
  });

  return chat.choices[0]?.message?.content?.trim() ?? mockCallScript(bill, rep, position);
}

/* ── Parse helpers ───────────────────────────────────────────────────────── */
function parseSummary(text: string, bill: Bill): BillSummary {
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    const json = JSON.parse(clean);
    return {
      plainEnglish: json.plainEnglish ?? "",
      whatItMeans:  json.whatItMeans  ?? "",
      districtImpact: json.districtImpact ?? "",
      stance: "neutral",
    };
  } catch {
    return mockSummary(bill);
  }
}

/* ── Mocks (no API key) ──────────────────────────────────────────────────── */
function mockSummary(bill: Bill): BillSummary {
  return {
    plainEnglish: `${bill.title} is a proposed federal law currently at: ${bill.latestAction.toLowerCase()}.`,
    whatItMeans: "Add a GROQ_API_KEY to .env.local for a full AI-written explanation.",
    districtImpact: "Add a GROQ_API_KEY to .env.local for a district-specific impact analysis.",
    stance: "neutral",
  };
}

function mockLetter(
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
    (note ? `${note}\n\n` : "") +
    `This issue matters deeply to me and to our community. I would appreciate knowing your position and your planned vote.\n\n` +
    `Thank you for your service.\n\nRespectfully,\nA constituent from ${rep.state}`
  );
}

function mockCallScript(
  bill: Bill,
  rep: Representative,
  position: "support" | "oppose",
): string {
  const title = rep.chamber === "Senate" ? "Senator" : "Representative";
  return (
    `Hi, my name is [YOUR NAME] and I'm a constituent calling to share my view on ${bill.type} ${bill.number}.\n\n` +
    `I'm calling to urge ${title} ${rep.name} to ${position} the ${bill.title}.\n\n` +
    `This issue directly affects our community, and I believe ${title} ${rep.name}'s vote on this matters.\n\n` +
    `Could you please pass along my message and let me know the ${title === "Senator" ? "Senator" : "Representative"}'s position?\n\n` +
    `Thank you very much.`
  );
}
