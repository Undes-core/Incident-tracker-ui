import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { VolumeBucket } from "../../api/dashboard/breakdowns";
import type { TimeRange } from "../../domain/filters";
import { bucketGranularityFor, formatBucketLabel } from "../../domain/volumeBuckets";
import { formatAge } from "../../domain/age";
import { AccessibleChartTable } from "../shared/AccessibleChartTable";

interface VolumeChartProps {
  buckets: VolumeBucket[];
  timeRange: TimeRange;
}

// Both plots read from the same tokens as the rest of the page, so the charts sit inside the
// design rather than beside it. Grid and axes are solid hairlines: dashing adds noise and reads
// as "threshold" or "projection" when it is only a grid.
const AXIS_TICK = { fill: "var(--subtle-foreground)", fontSize: 11 };
const GRID_STROKE = "var(--border-soft)";
// Both charts reserve the same gutter for their y-axis so the two x-scales line up, even though
// one counts incidents and the other counts minutes.
const Y_AXIS_WIDTH = 44;

const TOOLTIP_PROPS = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    boxShadow: "var(--shadow-md)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600, marginBottom: 2 },
  itemStyle: { padding: 0 },
} as const;

// Legend text wears a text token, never the series colour — the swatch beside it already carries
// identity, and coloured body text reads as a link or a status.
function legendLabel(value: string) {
  return <span style={{ color: "var(--muted-foreground)" }}>{value}</span>;
}

// FR-095/FR-096/P4: known/unknown volume over time, and median resolution time under it.
//
// These were one plot with two y-scales — counts on the left, minutes on the right. The alignment
// between two such scales is arbitrary, so the chart invented a relationship that is not in the
// data: with one bucket at ~1600 minutes the line collapsed onto the floor and stayed there,
// saying nothing about any other day. Two plots, one scale each, sharing the x-axis: the same
// comparison is still available to the eye, and neither series distorts the other.
export function VolumeChart({ buckets, timeRange }: VolumeChartProps) {
  const granularity = bucketGranularityFor(timeRange);
  const rows = buckets.map((bucket) => ({
    ...bucket,
    label: formatBucketLabel(bucket.bucketStart, granularity),
  }));
  const hasResolutionData = rows.some((row) => row.medianResolutionMinutes !== null);

  return (
    <section
      aria-label="Incident volume"
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <ResponsiveContainer width="100%" height={208}>
        <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            width={Y_AXIS_WIDTH}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip cursor={{ fill: "var(--muted)" }} {...TOOLTIP_PROPS} />
          <Legend wrapperStyle={{ fontSize: 12 }} formatter={legendLabel} />
          {/* Identity, not judgement: "unknown" means not classified yet, so these are chart
              series rather than --ok/--bad. The surface-coloured stroke is what puts a 2px gap
              between the two stacked fills instead of a border around them. maxBarSize keeps a
              five-bucket range from rendering as saturated slabs the width of the card.

              Animation is off because these panels poll: TanStack Query hands Recharts new data
              every refetch, and each one replays the grow-from-baseline transition. On a dashboard
              left open that is a chart redrawing itself every thirty seconds for no reason. */}
          <Bar
            dataKey="known"
            stackId="volume"
            name="Known"
            fill="var(--chart-1)"
            stroke="var(--card)"
            strokeWidth={1.5}
            maxBarSize={28}
            isAnimationActive={false}
          />
          <Bar
            dataKey="unknown"
            stackId="volume"
            name="Unknown"
            fill="var(--chart-2)"
            stroke="var(--card)"
            strokeWidth={1.5}
            maxBarSize={28}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 border-t border-border-soft pt-3">
        <h3 className="eyebrow mb-1">Median time to resolve</h3>
        {hasResolutionData ? (
          // One series, so no legend box — the heading above names it.
          <ResponsiveContainer width="100%" height={132}>
            <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              {/* scale="band" is what keeps this plot's Aug 9 above the bar chart's Aug 9. A
                  LineChart defaults to a point scale, which puts the first category hard against
                  the axis while bars sit centred in their band — the two x-axes then disagree by
                  half a band, and comparing the two plots by eye stops working, which is the only
                  reason to stack them. (padding="gap" looks like the same fix and does nothing
                  here.) */}
              <XAxis
                dataKey="label"
                scale="band"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                width={Y_AXIS_WIDTH}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                unit="m"
              />
              <Tooltip
                formatter={(value) => [formatAge(Number(value)), "Median resolve"]}
                {...TOOLTIP_PROPS}
              />
              <Line
                dataKey="medianResolutionMinutes"
                name="Median resolve"
                stroke="var(--p3)"
                strokeWidth={2}
                connectNulls
                dot={{ r: 4, fill: "var(--p3)", stroke: "var(--card)", strokeWidth: 2 }}
                activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[13px] text-muted-foreground">Not yet available</p>
        )}
      </div>

      <AccessibleChartTable
        caption="Incident volume by bucket"
        columns={[
          { key: "label", label: granularity === "hour" ? "Hour" : "Day" },
          { key: "known", label: "Known" },
          { key: "unknown", label: "Unknown" },
          { key: "medianResolutionMinutes", label: "Median resolve" },
        ]}
        rows={rows.map((bucket) => ({
          label: bucket.label,
          known: bucket.known,
          unknown: bucket.unknown,
          medianResolutionMinutes:
            bucket.medianResolutionMinutes !== null
              ? formatAge(bucket.medianResolutionMinutes)
              : "Not yet available",
        }))}
      />
    </section>
  );
}
