import type { ReactNode } from "react";

// The design renders a tab's KPIs as ONE bordered container split by vertical hairlines, not as
// separate cards with gaps. `auto-cols-fr` keeps the cells equal for any tile count, so the three
// strips (Now/Performance/Knowledge) share this wrapper without configuring a column count.
export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr divide-x divide-border overflow-hidden rounded-lg border border-border bg-card">
      {children}
    </div>
  );
}
