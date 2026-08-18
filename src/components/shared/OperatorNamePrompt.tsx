import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "../../state/useFocusTrap";

interface OperatorNamePromptProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

// FR-120/FR-121/A11Y-3: the first attributed action prompts for a name and does not proceed until
// one is given; useFocusTrap keeps keyboard focus inside while it's open, Esc cancels.
export function OperatorNamePrompt({ isOpen, onSubmit, onCancel }: OperatorNamePromptProps) {
  const [name, setName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Your name" ref={containerRef}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (trimmed) onSubmit(trimmed);
        }}
      >
        <label>
          What's your name?
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <button type="submit">Continue</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}
