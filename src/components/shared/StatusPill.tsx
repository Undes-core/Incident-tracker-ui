import type { IncidentStatus } from "../../api/types";

// N3/A11Y-1: ESCALATED distinct from OPEN via data-status, not colour alone. Covers the full
// v2.0 status enum, including INVESTIGATING/MITIGATED observed in the v2 prototype.
// Neutral by default — only the statuses that demand attention take a tint.
const PILL_CLASS = [
  "inline-flex w-fit items-center rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground",
  "data-[status=ESCALATED]:bg-chip-bad-bg data-[status=ESCALATED]:text-bad",
  "data-[status=OPEN]:bg-chip-info-bg data-[status=OPEN]:text-p3",
  "data-[status=INVESTIGATING]:bg-chip-warn-bg data-[status=INVESTIGATING]:text-warn",
  "data-[status=MITIGATED]:bg-chip-ok-bg data-[status=MITIGATED]:text-ok",
  "data-[status=RESOLVED]:bg-chip-ok-bg data-[status=RESOLVED]:text-ok",
].join(" ");

export function StatusPill({ status }: { status: IncidentStatus }) {
  return (
    <span data-status={status} className={PILL_CLASS}>
      {status}
    </span>
  );
}
