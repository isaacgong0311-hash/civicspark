import type { EvidenceCard, MissionQuestion, MissionSource } from "./types";

export function validateCitations(
  sources: MissionSource[],
  items: Array<EvidenceCard | MissionQuestion>,
): { valid: boolean; missing: string[] } {
  const known = new Set(sources.map((source) => source.id));
  const missing = new Set<string>();
  for (const item of items) {
    if (item.sourceIds.length === 0) missing.add(`${item.id}:no-source`);
    for (const sourceId of item.sourceIds) {
      if (!known.has(sourceId)) missing.add(`${item.id}:${sourceId}`);
    }
  }
  return { valid: missing.size === 0, missing: [...missing] };
}
