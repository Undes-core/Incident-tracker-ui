import type { IncidentStatus } from "../../api/types";

// N3/A11Y-1: ESCALATED distinct from OPEN via data-status, not colour alone. Covers the full
// v2.0 status enum, including INVESTIGATING/MITIGATED observed in the v2 prototype.
export function StatusPill({ status }: { status: IncidentStatus }) {
  return <span data-status={status}>{status}</span>;
}
