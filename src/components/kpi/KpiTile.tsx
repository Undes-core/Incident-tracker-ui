import type { ReactNode } from "react";

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
}

// N1/FR-028-029/A11Y-1: every tile is clickable and filters to the rows that produced its
// value; urgent/cautionary severity always carries a text label alongside its styling.
export function KpiTile({ label, value, sub, delta, severity = "none", onClick, isActive = false }: KpiTileProps) {
  return (
    <button onClick={onClick} data-severity={severity} data-active={isActive}>
      <div>
        <span>{label}</span>
        {delta && <span data-good={delta.isGood}>{delta.label}</span>}
      </div>
      <div>{value}</div>
      {sub && <div>{sub}</div>}
    </button>
  );
}
