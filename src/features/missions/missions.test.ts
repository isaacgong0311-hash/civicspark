import { describe, expect, it } from "vitest";
import { DEMO_MISSION, DEMO_RESPONSES } from "./demo-data";
import { validateCitations } from "./citations";
import { calculateMetrics, scoreResponse } from "./metrics";
import { joinCodeSchema, nicknameSchema, reviewSchema } from "./schemas";

describe("mission validation", () => {
  it("normalizes valid join codes", () => {
    expect(joinCodeSchema.parse(" spark6 ")).toBe("SPARK6");
    expect(joinCodeSchema.safeParse("short").success).toBe(false);
  });

  it("protects pseudonyms and returned-letter feedback", () => {
    expect(nicknameSchema.safeParse("A").success).toBe(false);
    expect(reviewSchema.safeParse({ status: "returned" }).success).toBe(false);
    expect(reviewSchema.safeParse({ status: "returned", feedback: "Add your own example." }).success).toBe(true);
  });
});

describe("citation integrity", () => {
  it("accepts the published demo mission", () => {
    expect(validateCitations(DEMO_MISSION.sources, [...DEMO_MISSION.evidence, ...DEMO_MISSION.questions])).toEqual({ valid: true, missing: [] });
  });

  it("rejects unknown and empty citations", () => {
    const result = validateCitations(DEMO_MISSION.sources, [
      { ...DEMO_MISSION.evidence[0], sourceIds: ["not-real"] },
      { ...DEMO_MISSION.questions[0], sourceIds: [] },
    ]);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("age-limit:not-real");
    expect(result.missing).toContain("q-age:no-source");
  });
});

describe("mission metrics", () => {
  it("scores knowledge and aggregates anonymous outcomes", () => {
    expect(scoreResponse(DEMO_MISSION, DEMO_RESPONSES[0])).toBe(100);
    expect(calculateMetrics(DEMO_MISSION, DEMO_RESPONSES)).toMatchObject({
      participants: 2,
      completed: 2,
      completionRate: 100,
      averageKnowledgeScore: 100,
      averageConfidenceShift: 2,
      positions: { support: 1, unsure: 1, oppose: 0 },
    });
  });
});
