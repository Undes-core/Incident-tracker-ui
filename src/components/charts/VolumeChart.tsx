import {
  ComposedChart,
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

// FR-095/FR-096/P4: stacked known/unknown volume with median resolution time overlaid on a
// secondary axis; bucket granularity (hour vs day) follows the active time range.
export function VolumeChart({ buckets, timeRange }: VolumeChartProps) {
  const granularity = bucketGranularityFor(timeRange);
  const rows = buckets.map((bucket) => ({
    ...bucket,
    label: formatBucketLabel(bucket.bucketStart, granularity),
  }));

  return (
    <section aria-label="Incident volume" className="rounded-lg border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={rows}>
          {/* Axes and grid read from the same tokens as the rest of the page so the chart sits
              inside the design rather than beside it. */}
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--subtle-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            yAxisId="volume"
            tick={{ fill: "var(--subtle-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="resolution"
            orientation="right"
            tick={{ fill: "var(--subtle-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="volume" dataKey="known" stackId="volume" name="Known" fill="var(--ok)" />
          <Bar
            yAxisId="volume"
            dataKey="unknown"
            stackId="volume"
            name="Unknown"
            fill="var(--bad)"
          />
          <Line
            yAxisId="resolution"
            dataKey="medianResolutionMinutes"
            name="Median resolve (min)"
            stroke="var(--p3)"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
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
