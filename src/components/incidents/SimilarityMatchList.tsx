import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSimilarityMatches } from "../../api/incidents/detail";
import type { IncidentDetail } from "../../api/incidents/detail";

interface SimilarityMatchListProps {
  incidentId: string;
  matches: IncidentDetail["similarityMatches"];
}

const INITIAL_CAP = 5;

// FR-066/P-4: the detail endpoint sends only the top five by score; "show all" lazily fetches the
// uncapped list from its own endpoint rather than re-slicing a client-side array that was never
// more than five items long.
export function SimilarityMatchList({ incidentId, matches }: SimilarityMatchListProps) {
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["incidents", incidentId, "similarity-matches"],
    queryFn: () => fetchSimilarityMatches(incidentId),
    enabled: showAll,
  });

  if (matches.length === 0) {
    return <p>No similar incidents or runbooks found.</p>;
  }

  const source = showAll && data ? data.matches : matches;
  const visible = [...source].sort((a, b) => b.score - a.score);

  return (
    <section aria-label="Similarity matches">
      <ul>
        {visible.map((match) => (
          <li key={match.id}>
            <span>{match.documentType}</span>
            <h3>{match.title}</h3>
            <div role="img" aria-label={`Match score ${match.score.toFixed(2)}`}>
              <div style={{ width: `${match.score * 100}%` }} />
            </div>
            <span>{match.score.toFixed(2)}</span>
            <p>{match.summarySnippet}</p>
            <a href={match.sourceUrl} target="_blank" rel="noopener noreferrer">
              View source
            </a>
          </li>
        ))}
      </ul>
      {!showAll && matches.length >= INITIAL_CAP && (
        <button type="button" onClick={() => setShowAll(true)}>
          Show all
        </button>
      )}
      {showAll && isLoading && <p>Loading all matches…</p>}
      {showAll && isError && (
        <div role="alert">
          <p>{(error as Error | undefined)?.message ?? "Could not load all matches."}</p>
          <button onClick={() => refetch()}>Retry</button>
        </div>
      )}
    </section>
  );
}
