import type { ActiveFilter } from "../../domain/filters";

interface CrossTabFilterChipProps {
  filter: ActiveFilter;
  onClear: () => void;
}

// FR-022/FR-026/XT-3: names the active filter with a one-click clear, rendered distinctly when
// it originated from another tab so its provenance is obvious at a glance.
export function CrossTabFilterChip({ filter, onClear }: CrossTabFilterChipProps) {
  return (
    <span data-cross-tab={filter.isCrossTab}>
      {filter.label}
      <button type="button" onClick={onClear} aria-label="Clear filter">
        ×
      </button>
    </span>
  );
}
