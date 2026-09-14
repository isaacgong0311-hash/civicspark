import "server-only";

import type { Bill } from "@/lib/types";
import type { MissionSource } from "./types";

const API_BASE = "https://api.congress.gov/v3";

function publicBillUrl(bill: Bill): string {
  const typeMap: Record<string, string> = { HR: "house-bill", S: "senate-bill", HRES: "house-resolution", SRES: "senate-resolution", HJRES: "house-joint-resolution", SJRES: "senate-joint-resolution" };
  return `https://www.congress.gov/bill/${bill.congress}th-congress/${typeMap[bill.type.toUpperCase()] ?? "house-bill"}/${bill.number}`;
}

function clean(value: string | undefined, fallback: string): string {
  return (value ?? fallback).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1600);
}

export async function captureBillSources(bill: Bill): Promise<MissionSource[]> {
  const publicUrl = publicBillUrl(bill);
  const sources: MissionSource[] = [
    { id: "bill-record", label: `${bill.type} ${bill.number} — Official record`, url: bill.url || publicUrl, publisher: "Congress.gov", excerpt: clean(`${bill.title}. ${bill.latestAction}`, "Official bill record.") },
  ];
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return sources;

  const base = `${API_BASE}/bill/${bill.congress}/${bill.type.toLowerCase()}/${bill.number}`;
  const endpoints = [
    { id: "bill-summary", label: "CRS bill summary", suffix: "/summaries", publicSuffix: "/summary", pick: (data: unknown) => (data as { summaries?: Array<{ text?: string }> }).summaries?.[0]?.text },
    { id: "bill-actions", label: "Legislative actions", suffix: "/actions", publicSuffix: "/all-actions", pick: (data: unknown) => (data as { actions?: Array<{ text?: string; actionDate?: string }> }).actions?.slice(0, 4).map((item) => `${item.actionDate ?? ""}: ${item.text ?? ""}`).join(" ") },
  ];
  const endpointPromise = Promise.allSettled(endpoints.map(async (endpoint) => {
    const response = await fetch(`${base}${endpoint.suffix}?api_key=${apiKey}&format=json&limit=20`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000), cache: "no-store" });
    if (!response.ok) throw new Error(`Congress.gov ${response.status}`);
    const data = await response.json() as unknown;
    const excerpt = clean(endpoint.pick(data), "");
    return excerpt ? { id: endpoint.id, label: endpoint.label, url: `${publicUrl}${endpoint.publicSuffix}`, publisher: "Congress.gov" as const, excerpt } : null;
  }));
  const textPromise = (async (): Promise<MissionSource | null> => {
    try {
      const response = await fetch(`${base}/text?api_key=${apiKey}&format=json`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000), cache: "no-store" });
      if (!response.ok) return null;
      const data = await response.json() as { textVersions?: Array<{ date?: string; formats?: Array<{ type?: string; url?: string }> }> };
      const versions = data.textVersions ?? [];
      const latest = versions.at(-1) ?? versions[0];
      const format = latest?.formats?.find((item) => item.type?.toLowerCase().includes("formatted text")) ?? latest?.formats?.find((item) => item.url);
      if (!format?.url) return null;
      const textUrl = new URL(format.url);
      if (textUrl.protocol !== "https:" || !textUrl.hostname.endsWith("congress.gov")) return null;
      const textResponse = await fetch(textUrl, { signal: AbortSignal.timeout(12000), cache: "no-store" });
      if (!textResponse.ok) return null;
      const excerpt = clean(await textResponse.text(), "");
      return excerpt ? { id: "bill-text", label: `${bill.type} ${bill.number} — Official text`, url: textUrl.toString(), publisher: "Congress.gov", excerpt } : null;
    } catch {
      return null;
    }
  })();
  const [results, textSource] = await Promise.all([endpointPromise, textPromise]);
  if (textSource) sources.push(textSource);
  for (const result of results) if (result.status === "fulfilled" && result.value) sources.push(result.value);
  return sources;
}
