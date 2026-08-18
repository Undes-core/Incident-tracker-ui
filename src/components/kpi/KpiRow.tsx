import type { ReactNode } from "react";

// The design renders a tab's KPIs as ONE bordered container split by hairlines, not as separate
// cards with gaps. `auto-cols-fr` keeps the cells equal for any tile count, so the three strips
// (Now/Performance/Knowledge) share this wrapper without configuring a column count. Below `md`
// it drops to a 2-column grid (with a matching horizontal divider) rather than letting four tiles
// get crushed into an unreadable single row.
export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm md:grid-flow-col md:auto-cols-fr md:grid-cols-none md:divide-y-0">
      {children}
    </div>
  );
}
