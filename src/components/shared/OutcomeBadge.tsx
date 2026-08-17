import type { ExecutedActionStatus } from "../../api/types";

// EO-1: ROLLED_BACK is its own bucket, distinct from FAILED, textually and visually.
export function OutcomeBadge({ status }: { status: ExecutedActionStatus }) {
  return <span data-status={status}>{status.replace("_", " ")}</span>;
}
