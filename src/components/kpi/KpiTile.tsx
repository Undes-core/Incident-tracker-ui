import type { ComponentType, ReactNode } from "react";

export interface KpiTileDelta {
  label: string;
  isGood: boolean;
}

export interface KpiTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: KpiTileDelta;
  severity?: "urgent" | "cautionary" | "none";
  onClick?: () => void;
  isActive?: boolean;
  // FR-081: the average MAY be exposed in the tile's tooltip, labelled as the average — the
  // headline value itself stays the median.
  title?: string;
  // Purely decorative — reinforces what the tile counts at a glance. Never the only carrier of
  // meaning (the eyebrow label and value still say it in words either way).
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

// An independent card rather than a cell in a shared strip (see KpiRow) — each tile owns its own
// border, radius and hover elevation, plus a severity accent along its top edge so urgent/
// cautionary tiles read as distinct at a glance, not just via a tinted number.
const TILE_CLASS = [
  "group relative w-full overflow-hidden rounded-xl border border-border bg-card px-4 py-3.5 text-left shadow-xs",
  "transition-all hover:-translate-y-px hover:border-border hover:shadow-md",
  "before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:content-['']",
  "before:bg-transparent data-[severity=urgent]:before:bg-bad data-[severity=cautionary]:before:bg-warn",
  "data-[active=true]:border-transparent data-[active=true]:bg-selected-bg data-[active=true]:shadow-sm data-[active=true]:ring-2 data-[active=true]:ring-selected-ring/50",
].join(" ");

const VALUE_CLASS = [
  "text-[28px] font-semibold leading-none tracking-[-0.5px] tabular-nums text-foreground",
  "group-data-[severity=urgent]:text-bad group-data-[severity=cautionary]:text-warn",
].join(" ");

const ICON_WRAP_CLASS = [
  "flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-subtle-foreground transition-colors",
  "group-data-[severity=urgent]:bg-chip-bad-bg group-data-[severity=urgent]:text-bad",
  "group-data-[severity=cautionary]:bg-chip-warn-bg group-data-[severity=cautionary]:text-warn",
  "group-data-[active=true]:bg-card group-data-[active=true]:text-primary",
].join(" ");

const DELTA_CLASS = [
  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[11px] font-medium",
  "data-[good=true]:bg-chip-ok-bg data-[good=true]:text-ok data-[good=false]:bg-chip-bad-bg data-[good=false]:text-bad",
].join(" ");

// N1/FR-028-029/A11Y-1: every tile is clickable and filters to the rows that produced its
// value; urgent/cautionary severity always carries a text label alongside its styling.
export function KpiTile({
  label,
  value,
  sub,
  delta,
  severity = "none",
  onClick,
  isActive = false,
  title,
  icon: Icon,
}: KpiTileProps) {
  return (
    <button
      onClick={onClick}
      data-severity={severity}
      data-active={isActive}
      title={title}
      className={`group ${TILE_CLASS}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow inline-flex items-center gap-2">
          {Icon && (
            <span aria-hidden className={ICON_WRAP_CLASS}>
              <Icon className="size-3.5" />
            </span>
          )}
          {label}
        </span>
        {delta && (
          <span data-good={delta.isGood} className={DELTA_CLASS}>
            {delta.label}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={VALUE_CLASS}>{value}</span>
        {sub && <span className="meta">{sub}</span>}
      </div>
    </button>
  );
}
