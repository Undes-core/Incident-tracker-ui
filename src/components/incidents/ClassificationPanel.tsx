import type { IncidentDetail } from "../../api/incidents/detail";

interface ClassificationPanelProps {
  detail: IncidentDetail;
}

// PRD §D2/FR-063: shows the AI's classification, and "AI said X → human corrected to Y"
// side-by-side whenever a correction exists — surfacing corrections is how trust is earned.
export function ClassificationPanel({ detail }: ClassificationPanelProps) {
  const { aiClassification, correction } = detail;

  return (
    <section aria-label="AI classification">
      <div>
        <span>Category</span>
        <span>{aiClassification.category}</span>
      </div>
      <div>
        <span>Priority</span>
        {correction?.correctedPriority ? (
          <span>
            <span data-was="true">{aiClassification.priority}</span> → {correction.correctedPriority}
          </span>
        ) : (
          <span>{aiClassification.priority}</span>
        )}
      </div>
      <div>
        <span>Confidence</span>
        <span>
          {aiClassification.confidenceScore != null ? aiClassification.confidenceScore.toFixed(2) : "—"}
        </span>
      </div>
      {correction?.correctedCategory && (
        <div>
          <span>Category correction</span>
          <span>
            <span data-was="true">{aiClassification.category}</span> → {correction.correctedCategory}
          </span>
        </div>
      )}
    </section>
  );
}
