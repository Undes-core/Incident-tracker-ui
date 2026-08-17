import { describe, expect, it } from "vitest";
import { percentOfStageAbove, largestDrop } from "./funnel";
import type { FunnelStage } from "./funnel";

const stages: FunnelStage[] = [
  { key: "received", label: "Incidents received", count: 142, dropCount: null },
  { key: "classified", label: "Classified by AI", count: 142, dropCount: 0 },
  { key: "ragMatched", label: "RAG match found", count: 98, dropCount: 44 },
  { key: "recommended", label: "Action recommended", count: 87, dropCount: 11 },
  { key: "approvedOrAutoRun", label: "Approved / auto-run", count: 79, dropCount: 8 },
  { key: "executedSuccessfully", label: "Executed successfully", count: 71, dropCount: 8 },
  { key: "validatedResolved", label: "Validated + resolved", count: null, dropCount: null },
];

describe("percentOfStageAbove", () => {
  it("returns null for the first stage — there is no stage above it (FR-083)", () => {
    expect(percentOfStageAbove(stages, 0)).toBeNull();
  });

  it("computes the percentage of the immediately preceding stage's count (FR-083) — consistently for every stage, unlike the PRD's own worked example, which inconsistently mixes 'of received' and 'of the stage above' for different rows", () => {
    expect(percentOfStageAbove(stages, 2)).toBe(69); // 98/142 (ragMatched of classified)
    expect(percentOfStageAbove(stages, 3)).toBe(89); // 87/98 (recommended of ragMatched)
    expect(percentOfStageAbove(stages, 4)).toBe(91); // 79/87 (approvedOrAutoRun of recommended)
  });

  it("returns null once either count is unavailable", () => {
    expect(percentOfStageAbove(stages, 6)).toBeNull(); // validatedResolved
  });
});

describe("largestDrop", () => {
  it("names the stage pair with the largest dropCount, computed from the numbers themselves (FR-084)", () => {
    const drop = largestDrop(stages);
    expect(drop).toEqual({ fromLabel: "Classified by AI", toLabel: "RAG match found", magnitude: 44 });
  });

  it("ignores stages with an unavailable (null) dropCount", () => {
    const withUnavailableLargest: FunnelStage[] = [
      ...stages.slice(0, -1),
      { key: "validatedResolved", label: "Validated + resolved", count: null, dropCount: null },
    ];
    const drop = largestDrop(withUnavailableLargest);
    expect(drop?.toLabel).toBe("RAG match found");
  });

  it("returns null when no stage has a comparable drop (e.g. only the first stage exists)", () => {
    expect(largestDrop([stages[0]])).toBeNull();
  });
});
