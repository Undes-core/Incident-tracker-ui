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

// A cell inside KpiRow, so it owns no border or radius of its own — the row draws those. Active
// tiles get the ring the design uses for "this is the thing currently filtering the table" rather
// than a plain background swap, so it reads the same way IncidentTable's own active filter chip
// does.
const TILE_CLASS =
  "relative px-4 py-3.5 text-left transition-colors hover:bg-muted/60 data-[active=true]:bg-muted data-[active=true]:inset-ring-2 data-[active=true]:inset-ring-ring/40";

// Severity tints the value only. The design leaves KPI values black, but dropping the signal
// entirely would lose FR-028/FR-029's urgent/cautionary distinction, so it survives as the one
// coloured glyph in the row. A11Y-1 still holds: the label and the number carry the meaning.
const VALUE_CLASS = [
  "text-[30px] font-semibold leading-none tracking-[-1px] tabular-nums",
  "group-data-[severity=urgent]:text-bad group-data-[severity=cautionary]:text-warn",
].join(" ");

const ICON_CLASS = [
  "size-3.5 shrink-0 text-subtle-foreground",
  "group-data-[severity=urgent]:text-bad group-data-[severity=cautionary]:text-warn",
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
        <span className="eyebrow inline-flex items-center gap-1.5">
          {Icon && <Icon aria-hidden className={ICON_CLASS} />}
          {label}
        </span>
        {delta && (
          <span
            data-good={delta.isGood}
            className="inline-flex items-center gap-0.5 font-mono text-[11px] data-[good=true]:text-ok data-[good=false]:text-bad"
          >
            {delta.label}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className={VALUE_CLASS}>{value}</span>
        {sub && <span className="meta">{sub}</span>}
      </div>
    </button>
  );
}
