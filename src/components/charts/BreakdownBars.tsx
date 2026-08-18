import type { Priority } from "../../api/types";
import { useCrossTabJump } from "../../state/useCrossTabJump";
import { PriorityPill } from "../shared/PriorityPill";
import { AccessibleChartTable } from "../shared/AccessibleChartTable";

type BreakdownVariant = "priority" | "category" | "service";

interface BreakdownBarsProps {
  variant: "priority";
  rows: Array<{ priority: Priority; count: number }>;
}

interface CategoryBreakdownBarsProps {
  variant: "category";
  rows: Array<{ category: string; count: number }>;
}

interface ServiceBreakdownBarsProps {
  variant: "service";
  rows: Array<{ serviceId: string; serviceName: string; count: number; knownRate: number }>;
}

type Props = BreakdownBarsProps | CategoryBreakdownBarsProps | ServiceBreakdownBarsProps;

interface NormalizedRow {
  id: string;
  label: string;
  count: number;
  breakdownKey: string;
  knownRatePercent?: number;
}

const VARIANT_LABEL: Record<BreakdownVariant, string> = {
  priority: "Breakdown by priority",
  category: "Breakdown by category",
  service: "Breakdown by service",
};

function normalize(props: Props): NormalizedRow[] {
  switch (props.variant) {
    case "priority":
      return props.rows.map((row) => ({
        id: row.priority,
        label: row.priority,
        count: row.count,
        breakdownKey: `priority:${row.priority}`,
      }));
    case "category":
      return props.rows.map((row) => ({
        id: row.category,
        label: row.category,
        count: row.count,
        breakdownKey: `category:${row.category}`,
      }));
    case "service":
      return props.rows.map((row) => ({
        id: row.serviceId,
        label: row.serviceName,
        count: row.count,
        breakdownKey: `service:${row.serviceId}`,
        knownRatePercent: Math.round(row.knownRate * 100),
      }));
  }
}

// FR-097/FR-098/P5: one hand-rolled bars component parameterized for all three breakdowns —
// ordering and top-N+Other selection are the server's job (contracts/dashboard-endpoints.md);
// every segment routes through the same useCrossTabJump call site a funnel stage uses, so a
// breakdown click behaves identically (switch to Now, apply filter, flash, chip, toast).
export function BreakdownBars(props: Props) {
  const jump = useCrossTabJump();
  const rows = normalize(props);
  const maxCount = Math.max(1, ...rows.map((row) => row.count));

  function handleClick(row: NormalizedRow) {
    jump({
      kind: "breakdown",
      key: row.breakdownKey,
      label: `${VARIANT_LABEL[props.variant]}: ${row.label}`,
      toastMessage: `Jumped to Now — ${row.label}.`,
    });
  }

  return (
    <section
      aria-label={VARIANT_LABEL[props.variant]}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <ol>
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => handleClick(row)}
              className="-mx-2 grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="text-[13px]">
                {props.variant === "priority" ? (
                  <PriorityPill priority={row.label as Priority} />
                ) : (
                  row.label
                )}
              </span>
              <span className="meta tabular-nums text-foreground">
                {row.count}
                {row.knownRatePercent !== undefined && (
                  <span className="ml-1.5 text-subtle-foreground">
                    {row.knownRatePercent}% known
                  </span>
                )}
              </span>
              <div
                role="img"
                aria-label={`${row.label} count ${row.count}`}
                className="col-span-2 mt-1 h-1 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  style={{ width: `${(row.count / maxCount) * 100}%` }}
                  className="h-full rounded-full bg-primary/60"
                />
              </div>
            </button>
          </li>
        ))}
      </ol>
      <AccessibleChartTable
        caption={VARIANT_LABEL[props.variant]}
        columns={[
          { key: "label", label: "Segment" },
          { key: "count", label: "Count" },
          { key: "knownRatePercent", label: "Known rate" },
        ]}
        rows={rows.map((row) => ({
          label: row.label,
          count: row.count,
          knownRatePercent: row.knownRatePercent !== undefined ? `${row.knownRatePercent}%` : "—",
        }))}
      />
    </section>
  );
}
