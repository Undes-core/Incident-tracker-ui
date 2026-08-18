import { useEffect, useRef, useState } from "react";
import type { PendingApprovalCard } from "../../api/approvals/pending";
import { useApproveAction } from "../../api/approvals/approve";
import { useRejectAction } from "../../api/approvals/reject";
import { useExecutionStatus } from "../../api/approvals/execution";
import { ApiError } from "../../api/client";
import { isStillRunning, formatElapsedMs, elapsedExecutionMs } from "../../domain/execution";
import { toRejectRequest, type RejectFormValues } from "../../domain/rejection";
import { RiskBadge } from "../shared/RiskBadge";
import { ConfidenceBar } from "../shared/ConfidenceBar";
import { OutcomeBadge } from "../shared/OutcomeBadge";
import { ParametersViewer } from "./ParametersViewer";
import { WhyThisAction } from "./WhyThisAction";
import { RejectForm } from "./RejectForm";
import { useApproveConfirmGate } from "./useApproveConfirmGate";
import { useOperatorNameGate } from "../shared/useOperatorNameGate";

type CardPhase = "proposed" | "executing" | "showing-reject-form" | "submitting-reject" | "rejected";

interface ApprovalCardProps {
  card: PendingApprovalCard;
  // Called once the reject mutation is confirmed by the server — lets a list-owning parent
  // (ApprovalQueue) drop this specific card from its own local view. Optional: this card still
  // shows its own terminal "Rejected" state regardless, for callers with no list to update.
  onRejected?: () => void;
}

// FR-033-045, §11.19: owns its own approve/reject mutations, keyed by this card's own action id —
// never by array index — so a sibling card's resolution or removal can never disturb this one.
export function ApprovalCard({ card, onRejected }: ApprovalCardProps) {
  const [phase, setPhase] = useState<CardPhase>("proposed");
  const [approveError, setApproveError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const hasClickedApprove = useRef(false);

  const approveMutation = useApproveAction(card.id);
  const rejectMutation = useRejectAction(card.id);
  const { requestApprove, confirmModal } = useApproveConfirmGate(card.description);
  const { requireOperatorName, operatorNamePrompt } = useOperatorNameGate();
  // Gated on the approve mutation's own success, not just the optimistic phase flip, so this
  // never races the real backend's ExecutedAction record into existence before it's created.
  const executionQuery = useExecutionStatus(card.id, phase === "executing" && approveMutation.isSuccess);
  const execution = executionQuery.data;

  // Structurally-identical poll responses (still RUNNING, same startedAt) don't change `execution`
  // by reference, so nothing would otherwise force a re-render — the elapsed time and the
  // still-running switch are computed fresh at render time, and need one every second regardless
  // of whether the last poll actually returned new data.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (phase !== "executing" || execution?.status !== "RUNNING") return;
    const interval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [phase, execution?.status]);

  function performApprove(actor: string) {
    // FR-044/X-4: the synchronous ref guard is the real idempotency boundary — it blocks a second
    // mutate() call even from two clicks in the same event-loop tick, before any re-render.
    if (hasClickedApprove.current) return;
    hasClickedApprove.current = true;
    setApproveError(null);
    setPhase("executing"); // FR-045: applied optimistically, ahead of server confirmation.

    approveMutation.mutate(
      { actor, ...(card.riskLevel === "HIGH" ? { confirmedHighRisk: true as const } : {}) },
      {
        onError: (error) => {
          hasClickedApprove.current = false;
          setPhase("proposed");
          setApproveError(error instanceof ApiError ? error.message : "Could not approve this action.");
        },
      },
    );
  }

  function handleApproveClick() {
    requireOperatorName((actor) => requestApprove(card.riskLevel, () => performApprove(actor)));
  }

  function performReject(actor: string, values: RejectFormValues) {
    setRejectError(null);
    setPhase("submitting-reject");

    rejectMutation.mutate(toRejectRequest(values, actor), {
      onSuccess: () => {
        setPhase("rejected");
        onRejected?.();
      },
      onError: (error) => {
        setPhase("showing-reject-form");
        setRejectError(error instanceof ApiError ? error.message : "Could not reject this action.");
      },
    });
  }

  return (
    <li data-phase={phase} data-action-id={card.id}>
      <RiskBadge risk={card.riskLevel} />
      <p>
        {card.incidentTitle} · {card.serviceName}
      </p>
      <p>{card.description}</p>
      <ConfidenceBar confidence={card.confidenceScore} />
      <ParametersViewer actionId={card.id} actionType={card.actionType} />
      <WhyThisAction matches={card.topMatches} />

      {phase === "proposed" && (
        <div>
          <button type="button" onClick={handleApproveClick}>
            Approve
          </button>
          <button type="button" onClick={() => setPhase("showing-reject-form")}>
            Reject
          </button>
          {approveError && <p role="alert">{approveError}</p>}
        </div>
      )}

      {phase === "showing-reject-form" && (
        <div>
          <RejectForm
            onSubmit={(values) => requireOperatorName((actor) => performReject(actor, values))}
            onCancel={() => setPhase("proposed")}
          />
          {rejectError && <p role="alert">{rejectError}</p>}
        </div>
      )}

      {phase === "submitting-reject" && <p>Submitting rejection…</p>}
      {phase === "rejected" && <p data-status="REJECTED">Rejected</p>}

      {phase === "executing" && (
        <div>
          {!execution && <p>Submitting approval…</p>}
          {execution && execution.status === "RUNNING" && isStillRunning(execution.startedAt) && (
            <div>
              <p>Still running · {formatElapsedMs(elapsedExecutionMs(execution.startedAt))}</p>
              <button type="button" onClick={() => executionQuery.refetch()}>
                Check now
              </button>
            </div>
          )}
          {execution && execution.status === "RUNNING" && !isStillRunning(execution.startedAt) && (
            <p>Executing · {formatElapsedMs(elapsedExecutionMs(execution.startedAt))}</p>
          )}
          {execution && execution.status !== "RUNNING" && (
            <div>
              <OutcomeBadge status={execution.status} />
              {execution.errorMessage && <p role="alert">{execution.errorMessage}</p>}
            </div>
          )}
        </div>
      )}

      {confirmModal}
      {operatorNamePrompt}
    </li>
  );
}
