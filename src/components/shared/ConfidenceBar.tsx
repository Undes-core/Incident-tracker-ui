import { useOperator } from "../../state/OperatorContext";

interface ConfidenceBarProps {
  confidence: number;
}

// AR-2: bar + numeric value; below the threshold the card is visibly qualified.
export function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const { lowConfidenceThreshold } = useOperator();
  const isLow = confidence < lowConfidenceThreshold;

  return (
    <div>
      <div role="img" aria-label={`AI confidence ${confidence.toFixed(2)}`}>
        <div style={{ width: `${confidence * 100}%` }} data-low={isLow} />
      </div>
      <span>{confidence.toFixed(2)}</span>
      {isLow && <p>Low confidence — review parameters.</p>}
    </div>
  );
}
