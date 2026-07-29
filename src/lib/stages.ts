import type { BillStage } from "./types";

/** Shared legislative-stage labels — kept in one place so the bills browser
   and the My Bills dashboard render the same stage names. */
export const STAGE_LABELS = ["Introduced", "In Committee", "Floor Ready", "Passed", "Signed"];

export function stageName(stage?: BillStage | number): string {
  const i = Math.min(STAGE_LABELS.length - 1, Math.max(0, (stage ?? 1) - 1));
  return STAGE_LABELS[i] ?? "Introduced";
}
