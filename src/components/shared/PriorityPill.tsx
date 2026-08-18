import type { Priority } from "../../api/types";

// AR-1/A11Y-1: colour is never the sole carrier of meaning — the text label is the content itself.
export function PriorityPill({ priority }: { priority: Priority }) {
  return <span data-priority={priority}>{priority}</span>;
}
