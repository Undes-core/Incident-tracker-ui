// N1/FR-008: per-tile delta-is-good-or-bad interpretation for the four Now tiles. All three
// tiles that carry a delta (open incidents, escalated, unassigned) are "lower is better" — a
// rising count is never an improvement. Extended by US3 (T132) with Performance's median-resolve
// null-guard/no-value formatting.
export type NowTileKey = "openIncidents" | "escalated" | "unassigned";

export interface DeltaDisplay {
  label: string;
  isGood: boolean;
}

export function describeDelta(_tileKey: NowTileKey, delta: number): DeltaDisplay {
  const isGood = delta <= 0;
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  return { label: `${arrow} ${Math.abs(delta)}`, isGood };
}
