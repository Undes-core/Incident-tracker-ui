import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSubmitFeedback } from "../../api/feedback";
import type { FeedbackRecord } from "../../api/feedback";
import type { FeedbackType, Priority } from "../../api/types";
import { useOperatorNameGate } from "../shared/useOperatorNameGate";

interface FeedbackFormValues {
  feedbackType: FeedbackType | "";
  comments: string;
  correctedCategory?: string;
  correctedPriority?: Priority | "";
  correctedResolution?: string;
}

interface FeedbackFormProps {
  incidentId: string;
  existingFeedback: FeedbackRecord[];
}

// FR-073/PRD §D7: always-available, existing feedback listed above the form. Prepends the new
// row from the write response directly (contracts/feedback-endpoint.md) rather than refetching
// the whole drawer.
export function FeedbackForm({ incidentId, existingFeedback }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState(existingFeedback);
  const { requireOperatorName, operatorNamePrompt } = useOperatorNameGate();
  const mutation = useSubmitFeedback(incidentId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormValues>({ defaultValues: { feedbackType: "", comments: "" } });

  function onSubmit(values: FeedbackFormValues) {
    if (!values.feedbackType) return;
    requireOperatorName((actor) => {
      mutation.mutate(
        {
          actor,
          feedbackType: values.feedbackType as FeedbackType,
          comments: values.comments,
          correctedCategory: values.correctedCategory || undefined,
          correctedPriority: (values.correctedPriority || undefined) as Priority | undefined,
          correctedResolution: values.correctedResolution || undefined,
        },
        {
          onSuccess: (newRecord) => {
            setFeedback((prev) => [newRecord, ...prev]);
            reset();
          },
        },
      );
    });
  }

  return (
    <section aria-label="Feedback">
      <h3>Existing feedback</h3>
      {feedback.length === 0 ? (
        <p>No feedback submitted yet.</p>
      ) : (
        <ul>
          {feedback.map((f) => (
            <li key={f.id}>
              <span>{f.feedbackType}</span>
              <span>{f.comments}</span>
              <span>{f.createdBy}</span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <label>
          Feedback type
          <select {...register("feedbackType", { validate: (value) => Boolean(value) || "Feedback type is required" })}>
            <option value="">Select…</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CORRECTED">Corrected</option>
          </select>
        </label>
        {errors.feedbackType && <p role="alert">{errors.feedbackType.message}</p>}

        <label>
          Comments
          <textarea {...register("comments", { validate: (value) => value.trim().length > 0 || "Comments are required" })} />
        </label>
        {errors.comments && <p role="alert">{errors.comments.message}</p>}

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
        <label>
          Corrected resolution (optional)
          <textarea {...register("correctedResolution")} />
        </label>

        <button type="submit">Submit feedback</button>
      </form>
      {operatorNamePrompt}
    </section>
  );
}
