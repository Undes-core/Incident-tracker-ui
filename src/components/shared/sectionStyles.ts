// Shared Tailwind class strings for the stacked panels in the drawer and the Performance /
// Knowledge tabs. One place so every panel reads as the same card, and so a spacing change is one
// edit rather than twenty. Pure constants — no components — so it stays outside the
// react-refresh boundary.
//
// These encode the canvas design's rules: hairline borders on white, no tinted panels, uppercase
// letter-spaced eyebrows for labels, mono for every metadatum and number.

export const SECTION = "rounded-lg border border-border bg-card p-4";

export const SECTION_TITLE = "mb-3 text-[15px] font-semibold tracking-[-0.2px]";

export const EYEBROW = "eyebrow";

export const META = "meta";

export const DISCLOSURE =
  "flex w-fit items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground aria-expanded:text-foreground";

export const CODE_BLOCK =
  "overflow-x-auto rounded-lg border border-border bg-muted/60 p-3 font-mono text-[12px] leading-relaxed";

export const MUTED_NOTE = "text-[13px] text-muted-foreground";

export const ALERT_NOTE = "text-[13px] font-medium text-bad";

export const FIELD_LABEL = "grid gap-1.5 text-[13px] font-medium text-muted-foreground";

export const FIELD_CONTROL =
  "rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-normal text-foreground";

export const BUTTON_PRIMARY =
  "w-fit rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50";

export const BUTTON_SECONDARY =
  "w-fit rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50";

// A hairline meter track + its fill, used by the similarity and feedback-impact bars alike.
export const METER_TRACK = "h-[3px] w-full overflow-hidden rounded-full bg-muted";
export const METER_FILL = "h-full rounded-full bg-primary";

// An inset row inside a panel: the design separates list items with hairlines rather than
// wrapping each one in its own tinted box.
export const ROW = "border-t border-border-soft py-2.5 first:border-t-0 first:pt-0";
