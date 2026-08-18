import { useForm } from "react-hook-form";
import type { RejectFormValues } from "../../domain/rejection";

interface RejectFormProps {
  onSubmit: (values: RejectFormValues) => void;
  onCancel: () => void;
}

// FR-038/FR-039/AR-6: required reason, optional corrections. Does not call the API itself —
// ApprovalCard owns the mutation (component-inventory.md) and maps these values via
// domain/rejection.ts's toRejectRequest.
export function RejectForm({ onSubmit, onCancel }: RejectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectFormValues>({ defaultValues: { reason: "", correctedCategory: "", correctedPriority: undefined } });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))}>
      <label>
        Reason
        <textarea
          {...register("reason", {
            validate: (value) => value.trim().length > 0 || "A reason is required",
          })}
        />
      </label>
      {errors.reason && <p role="alert">{errors.reason.message}</p>}
      <label>
        Corrected category (optional)
        <input type="text" {...register("correctedCategory")} />
      </label>
      <label>
        Corrected priority (optional)
        <select {...register("correctedPriority")}>
          <option value="">—</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="P4">P4</option>
        </select>
      </label>
      <button type="submit">Submit rejection</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
