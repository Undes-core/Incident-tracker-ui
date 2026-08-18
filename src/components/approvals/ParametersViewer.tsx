import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchActionParameters } from "../../api/incidents/detail";
import type { ActionType } from "../../api/types";

interface ParametersViewerProps {
  actionId: string;
  actionType: ActionType;
}

function isSqlStatement(value: unknown): value is { statement: string } {
  return typeof value === "object" && value !== null && typeof (value as { statement?: unknown }).statement === "string";
}

// FR-035/P-4: collapsed by default, parameters fetched only on first expand, then rendered
// monospaced and syntax-highlighted — SQL is pretty-printed first. Both the tokenizer and
// sql-formatter are dynamically imported on that same first expand (research.md §8), so neither
// is part of the initial bundle.
export function ParametersViewer({ actionId, actionType }: ParametersViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [rendered, setRendered] = useState<ReactNode[] | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["actions", actionId, "parameters"],
    queryFn: () => fetchActionParameters(actionId),
    enabled: expanded,
  });

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    (async () => {
      const { renderHighlighted } = await import("./tokenizer");
      let text: string;
      if (actionType === "SQL" && isSqlStatement(data.parameters)) {
        const { format } = await import("sql-formatter");
        text = format(data.parameters.statement);
      } else {
        text = JSON.stringify(data.parameters, null, 2);
      }
      if (!cancelled) setRendered(renderHighlighted(text));
    })();
    return () => {
      cancelled = true;
    };
  }, [data, actionType]);

  return (
    <div>
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
        Parameters
      </button>
      {expanded && (
        <div>
          {isLoading && <p>Loading parameters…</p>}
          {isError && <p role="alert">Could not load parameters.</p>}
          {rendered && <pre>{rendered}</pre>}
        </div>
      )}
    </div>
  );
}
