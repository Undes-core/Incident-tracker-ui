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
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-fit items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground aria-expanded:text-foreground"
      >
        <span aria-hidden="true" className="text-[10px]">
          ▸
        </span>
        Why this action
      </button>
      {expanded &&
        (matches.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            No similar incidents or runbooks matched.
          </p>
        ) : (
          <ul className="mt-2 grid gap-1.5">
            {matches.map((match, index) => (
              <li
                key={`${match.sourceUrl}-${index}`}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border-soft bg-secondary px-2.5 py-1.5 text-[12.5px]"
              >
                <span className="rounded bg-muted px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {match.documentType}
                </span>
                <span className="text-foreground">{match.title}</span>
                <span className="font-mono text-[11.5px] text-subtle-foreground">
                  {match.score.toFixed(2)}
                </span>
                <a
                  href={match.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[12px] text-p3 underline underline-offset-2"
                >
                  View source
                </a>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
