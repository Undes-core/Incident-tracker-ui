import { useRef, type KeyboardEvent } from "react";
import { useUrlState } from "../../state/useUrlState";
import type { Tab } from "../../domain/filters";

const TABS: ReadonlyArray<{ key: Tab; label: string }> = [
  { key: "now", label: "Now" },
  { key: "performance", label: "Performance" },
  { key: "knowledge", label: "Knowledge" },
];

interface TabBarProps {
  pendingApprovalCount: number;
}

// TB-1..TB-3: tablist/tab/aria-selected with roving-tabindex arrow-key navigation, tab state
// via useUrlState, Now's badge hidden at zero (never rendered as "0").
export function TabBar({ pendingApprovalCount }: TabBarProps) {
  const { tab, setTab } = useUrlState();
  const buttonRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const moveFocus = (currentIndex: number, delta: number) => {
    const nextIndex = (currentIndex + delta + TABS.length) % TABS.length;
    const nextTab = TABS[nextIndex].key;
    setTab(nextTab);
    buttonRefs.current[nextTab]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(index, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(index, -1);
    }
  };

  return (
    <div className="border-b border-border bg-card">
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="mx-auto flex w-full max-w-[1360px] gap-6 px-6"
      >
        {TABS.map((entry, index) => {
          const isSelected = tab === entry.key;
          return (
            <button
              key={entry.key}
              ref={(el) => {
                buttonRefs.current[entry.key] = el;
              }}
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              // The selected underline hangs off aria-selected, so the visual state can never
              // drift from the state assistive tech is told about.
              className="-mb-px flex items-center gap-2 border-b-2 border-transparent py-3 text-[14px] text-muted-foreground transition-colors hover:text-foreground aria-selected:border-primary aria-selected:font-semibold aria-selected:text-foreground"
              onClick={() => setTab(entry.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {entry.label}
              {entry.key === "now" && pendingApprovalCount > 0 && (
                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {pendingApprovalCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
