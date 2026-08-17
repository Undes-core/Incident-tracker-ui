import type { RiskLevel } from "../../api/types";

// AR-1: risk badge is unmissable and always carries a text label, not colour alone.
export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <span data-risk={risk}>{risk} RISK</span>;
}
