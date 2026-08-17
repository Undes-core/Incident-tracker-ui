import type { DocumentDrivingResolution } from "../../api/dashboard/knowledge";
import { AccessibleChartTable } from "../shared/AccessibleChartTable";

interface DocumentsDrivingResolutionsProps {
  documents: DocumentDrivingResolution[];
}

// FR-102/K3: which documents earn their place — ranked by linked resolution count. The server
// already pre-sorts descending; this re-sort is a defensive no-op guarantee, not a trust issue.
export function DocumentsDrivingResolutions({ documents }: DocumentsDrivingResolutionsProps) {
  const sorted = [...documents].sort((a, b) => b.resolutionCount - a.resolutionCount);

  return (
    <section aria-label="Documents driving resolutions">
      <ol>
        {sorted.map((doc) => (
          <li key={doc.documentId}>
            <span>{doc.documentType}</span>
            <span>{doc.title}</span>
            <span>{doc.resolutionCount} resolutions</span>
          </li>
        ))}
      </ol>
      <AccessibleChartTable
        caption="Documents driving resolutions, descending"
        columns={[
          { key: "title", label: "Document" },
          { key: "documentType", label: "Type" },
          { key: "resolutionCount", label: "Resolutions" },
        ]}
        rows={sorted.map((d) => ({ title: d.title, documentType: d.documentType, resolutionCount: d.resolutionCount }))}
      />
    </section>
  );
}
