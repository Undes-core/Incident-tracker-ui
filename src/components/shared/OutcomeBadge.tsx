import type { ExecutedActionStatus } from "../../api/types";

// EO-1: ROLLED_BACK is its own bucket, distinct from FAILED, textually and visually — its own
// hue (--roll), never a shade of the failure red.
//
// A lookup map rather than `data-[status=...]` variants: Tailwind reads `_` inside an arbitrary
// variant as a space, so `data-[status=ROLLED_BACK]` compiles to a selector that never matches,
// and escaping it breaks differently because the scanner sees the raw source, not the runtime
// string. Literal class strings in a map are scanned correctly and can't drift.
const BASE =
  "inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]";

const BY_STATUS: Record<ExecutedActionStatus, string> = {
  RUNNING: "bg-chip-info-bg text-p3",
  SUCCESS: "bg-chip-ok-bg text-ok",
  FAILED: "bg-chip-bad-bg text-bad",
  ROLLED_BACK: "bg-[#f3edfd] text-roll",
};

export function OutcomeBadge({ status }: { status: ExecutedActionStatus }) {
  return (
    <span data-status={status} className={`${BASE} ${BY_STATUS[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}
