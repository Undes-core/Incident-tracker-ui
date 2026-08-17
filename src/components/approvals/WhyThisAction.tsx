import { useState } from "react";
import type { PendingApprovalCard } from "../../api/approvals/pending";

interface WhyThisActionProps {
  matches: PendingApprovalCard["topMatches"];
}

// FR-036: the similarity matches that drove the recommendation, already included on the card
// payload (contracts/approvals-endpoints.md) — no second request on expand.
export function WhyThisAction({ matches }: WhyThisActionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        Why this action
      </button>
      {expanded && (
        matches.length === 0 ? (
          <p>No similar incidents or runbooks matched.</p>
        ) : (
          <ul>
            {matches.map((match, index) => (
              <li key={`${match.sourceUrl}-${index}`}>
                <span>{match.documentType}</span>
                <span>{match.title}</span>
                <span>{match.score.toFixed(2)}</span>
                <a href={match.sourceUrl} target="_blank" rel="noopener noreferrer">
                  View source
                </a>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
