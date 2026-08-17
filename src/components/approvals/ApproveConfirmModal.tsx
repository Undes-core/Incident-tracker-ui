import { useEffect, useRef } from "react";
import { useFocusTrap } from "../../state/useFocusTrap";

interface ApproveConfirmModalProps {
  isOpen: boolean;
  actionDescription: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// FR-037/§11.2/A11Y-3: restates the action and requires a second explicit click. Only ever opened
// for a HIGH-risk action — the risk check itself lives in useApproveConfirmGate. Esc cancels,
// matching the detail drawer's own modal dismissal.
export function ApproveConfirmModal({ isOpen, actionDescription, onConfirm, onCancel }: ApproveConfirmModalProps) {
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
    <div role="dialog" aria-modal="true" aria-label="Confirm high-risk action" ref={containerRef}>
      <p>This is a HIGH-risk action. Please confirm:</p>
      <p>{actionDescription}</p>
      <button type="button" onClick={onConfirm}>
        Confirm approve
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
