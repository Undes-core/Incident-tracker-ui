import type { RiskLevel } from "../../api/types";

// AR-1: risk badge is unmissable and always carries a text label, not colour alone.
// The design confines risk colour to this chip and the confidence meter — nothing else on the
// card is tinted, so the chip has to carry the weight on its own.
const BADGE_CLASS = [
  "inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]",
  "data-[risk=LOW]:bg-chip-ok-bg data-[risk=LOW]:text-ok",
  "data-[risk=MEDIUM]:bg-chip-warn-bg data-[risk=MEDIUM]:text-warn",
  "data-[risk=HIGH]:bg-chip-bad-bg data-[risk=HIGH]:text-bad",
].join(" ");

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span data-risk={risk} className={BADGE_CLASS}>
      {risk} RISK
    </span>
  );
}
