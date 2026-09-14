import "server-only";

import Groq from "groq-sdk";
import { z } from "zod";
import type { Bill } from "@/lib/types";
import { validateCitations } from "./citations";
import { captureBillSources } from "./sources";
import type { EvidenceCard, MissionQuestion } from "./types";

const contentSchema = z.object({
  evidence: z.array(z.object({ id: z.string(), heading: z.string().min(4), explanation: z.string().min(20), sourceIds: z.array(z.string()).min(1), perspective: z.enum(["fact", "supporting", "opposing"]) })).min(4).max(6),
  questions: z.array(z.object({ id: z.string(), prompt: z.string().min(10), choices: z.array(z.string()).length(4), correctChoice: z.number().int().min(0).max(3), explanation: z.string().min(15), sourceIds: z.array(z.string()).min(1) })).length(3),
});

export async function generateMissionContent(bill: Bill, gradeBand: string): Promise<{ evidence: EvidenceCard[]; questions: MissionQuestion[]; sources: Awaited<ReturnType<typeof captureBillSources>>; generatedByAI: boolean }> {
  const sources = await captureBillSources(bill);
  const client = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 20000, maxRetries: 2 }) : null;
  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
        temperature: .2,
        max_tokens: 2400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a nonpartisan civic curriculum designer. Use only the supplied official-source excerpts. Every factual sentence must cite at least one supplied source ID. Supporting and opposing cards must be explicitly framed as arguments, never facts. Do not invent local impacts, statistics, outcomes, or bill provisions. Return strict JSON only." },
          { role: "user", content: `Create 4-6 evidence cards and exactly 3 four-choice knowledge questions for grade band ${gradeBand}. Bill: ${bill.type} ${bill.number}, ${bill.title}. Sources:\n${sources.map((source) => `[${source.id}] ${source.excerpt}`).join("\n")}\nReturn {"evidence":[{"id":"...","heading":"...","explanation":"...","sourceIds":["..."],"perspective":"fact|supporting|opposing"}],"questions":[{"id":"...","prompt":"...","choices":["...","...","...","..."],"correctChoice":0,"explanation":"...","sourceIds":["..."]}]}. Include at least one supporting and one opposing argument.` },
        ],
      });
      const parsed = contentSchema.safeParse(JSON.parse(completion.choices[0]?.message?.content ?? "{}"));
      if (parsed.success) {
        const citations = validateCitations(sources, [...parsed.data.evidence, ...parsed.data.questions]);
        if (citations.valid) return { ...parsed.data, sources, generatedByAI: true };
      }
    } catch (error) {
      console.error("Mission generation failed:", error instanceof Error ? error.message : error);
    }
  }

  const sourceIds = sources.map((source) => source.id);
  return {
    sources,
    generatedByAI: false,
    evidence: [
      { id: "official-purpose", heading: "Start with the official purpose", explanation: `${bill.type} ${bill.number} is titled “${bill.title}.” Read the linked record before deciding what outcomes the proposal might produce.`, sourceIds: [sourceIds[0]], perspective: "fact" },
      { id: "official-status", heading: "Track where it stands", explanation: bill.latestAction || "The official actions record shows the bill’s current step in Congress.", sourceIds: [sourceIds.find((id) => id === "bill-actions") ?? sourceIds[0]], perspective: "fact" },
      { id: "supporting-case", heading: "Build the strongest supporting case", explanation: "A supporter would ask whether the proposal’s stated mechanism could address the problem named in the official record.", sourceIds: [sourceIds[0]], perspective: "supporting" },
      { id: "opposing-case", heading: "Test the tradeoffs", explanation: "An opponent would ask what unintended costs, enforcement challenges, or individual-choice concerns the proposal might create.", sourceIds: [sourceIds[0]], perspective: "opposing" },
    ],
    questions: [
      { id: "record-q", prompt: "Which source is best for verifying what this proposal actually says?", choices: ["A viral post", "The official bill record", "An anonymous comment", "A campaign advertisement"], correctChoice: 1, explanation: "The official bill record is the primary source for the proposal’s text and status.", sourceIds: [sourceIds[0]] },
      { id: "status-q", prompt: "Which statement is supported by the latest action shown here?", choices: [bill.latestAction || "The recorded latest action", "The bill is guaranteed to become law", "Every member supports it", "The courts approved it"], correctChoice: 0, explanation: "Only the recorded action is supported; the other choices claim outcomes not established by the source.", sourceIds: [sourceIds.find((id) => id === "bill-actions") ?? sourceIds[0]] },
      { id: "argument-q", prompt: "Which item should be evaluated as an argument rather than an official fact?", choices: ["The bill number", "The official title", "A prediction about its effects", "Its recorded action"], correctChoice: 2, explanation: "A predicted effect is an argument about a future outcome, not a fact guaranteed by the bill text.", sourceIds: [sourceIds[0]] },
    ],
  };
}
