import type { CoverageGapService } from "../../domain/coverageGaps";
import { sortAscendingByKnownRate, highestLeverageFixCaption } from "../../domain/coverageGaps";
import { AccessibleChartTable } from "../shared/AccessibleChartTable";

interface CoverageGapsChartProps {
  services: CoverageGapService[];
}

type Threshold = "RED" | "AMBER" | "GREEN";

function thresholdFor(knownRate: number): Threshold {
  if (knownRate < 0.6) return "RED";
  if (knownRate < 0.8) return "AMBER";
  return "GREEN";
}

// FR-100/FR-101/K2: hand-rolled horizontal bars, worst-first, red/amber/green thresholds each
// carrying a text label (A11Y-1 — colour is never the only signal), with the highest-leverage fix
// named explicitly rather than left for the reader to infer.
export function CoverageGapsChart({ services }: CoverageGapsChartProps) {
  const sorted = sortAscendingByKnownRate(services);
  const caption = highestLeverageFixCaption(services);

  return (
    <section aria-label="Runbook coverage gaps">
      {caption && <p>{caption}</p>}
      <ol>
        {sorted.map((service) => {
          const percent = Math.round(service.knownRate * 100);
          const threshold = thresholdFor(service.knownRate);
          return (
            <li key={service.serviceId}>
              <span>{service.serviceName}</span>
              <div role="img" aria-label={`${service.serviceName} known-incident rate ${percent}%`}>
                <div data-threshold={threshold} style={{ width: `${percent}%` }} />
              </div>
              <span>{percent}%</span>
              <span>{threshold}</span>
            </li>
          );
        })}
      </ol>
      <AccessibleChartTable
        caption="Runbook coverage gaps by service, ascending"
        columns={[
          { key: "serviceName", label: "Service" },
          { key: "knownRatePercent", label: "Known-incident rate" },
        ]}
        rows={sorted.map((s) => ({ serviceName: s.serviceName, knownRatePercent: `${Math.round(s.knownRate * 100)}%` }))}
      />
    </section>
  );
}
