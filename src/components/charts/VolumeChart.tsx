import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
    <section aria-label="Incident volume">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis yAxisId="volume" />
          <YAxis yAxisId="resolution" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="volume" dataKey="known" stackId="volume" name="Known" fill="#2e7d32" />
          <Bar yAxisId="volume" dataKey="unknown" stackId="volume" name="Unknown" fill="#c62828" />
          <Line yAxisId="resolution" dataKey="medianResolutionMinutes" name="Median resolve (min)" stroke="#1565c0" />
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
            bucket.medianResolutionMinutes !== null ? formatAge(bucket.medianResolutionMinutes) : "Not yet available",
        }))}
      />
    </section>
  );
}
