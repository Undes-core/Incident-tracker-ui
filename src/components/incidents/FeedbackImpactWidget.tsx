import { useFeedbackImpact } from "../../api/feedbackImpact";
import { useOperator } from "../../state/OperatorContext";
import { RelativeTime } from "../shared/RelativeTime";

// FI-1..FI-5/FR-074-079/§11.20: the one motivational pattern in this product. Deliberately does
// NOT follow Principle VII's usual four states — FI-4 explicitly demands invisibility, not a
// caveated loading/error/empty state, whenever there's nothing meaningful (or too little) to show,
// so this returns null for every non-happy path rather than rendering a skeleton or error box for
// content that's non-critical and might end up suppressed anyway.
export function FeedbackImpactWidget() {
  const { operatorName } = useOperator();
  const { data, isLoading, isError } = useFeedbackImpact(operatorName);

  if (!operatorName || isLoading || isError || !data || data.suppressed) return null;

  const isDecline = data.personal.accuracyPercent < data.personal.previousAccuracyPercent;

  return (
    <div aria-label="Feedback impact">
      <p>Your corrections are training the classifier</p>
      <p>
        <strong>{data.personal.accuracyPercent}%</strong> classification accuracy,{" "}
        {isDecline ? "down from" : "up from"} {data.personal.previousAccuracyPercent}%
      </p>
      <div role="img" aria-label={`${data.personal.accuracyPercent}% classification accuracy`}>
        <div style={{ width: `${data.personal.accuracyPercent}%` }} />
      </div>
      {isDecline && (
        // FI-3/FR-078: never the user's failure — attributed to the model or the period, always.
        <p>This reflects the model or this period, not your feedback.</p>
      )}
      <p>
        {data.personal.correctionCount} corrections submitted
        {data.personal.lastCorrectionAt && (
          <>
            {" "}
            · last one <RelativeTime timestamp={data.personal.lastCorrectionAt} />
          </>
        )}
      </p>
      <p>
        Team total: {data.team.correctionCount} corrections this quarter across {data.team.engineerCount} engineers.
      </p>
    </div>
  );
}
