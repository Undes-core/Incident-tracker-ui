# Contract: Feedback

## `POST /api/incidents/:id/feedback`

**Purpose**: Writes `developer_feedback` from the always-available §D7 form (FR-049).

**Consumed by**: `components/incidents/FeedbackForm` (inside the detail drawer).

**Request**:

```ts
{
  actor: string;                                  // FR-077
  feedbackType: "APPROVED" | "REJECTED" | "CORRECTED";
  comments: string;
  correctedCategory?: string;
  correctedPriority?: "P1" | "P2" | "P3" | "P4";
  correctedResolution?: string;
}
```

**Response**: `201 Created` with the new feedback row, in the same shape returned by
`GET /api/incidents/:id`'s `feedback` array — the client prepends it rather than re-fetching the
whole drawer (FR-049: "existing feedback listed above the form").

**Errors**: `404` if the incident id no longer exists (rare — no incident deletion exists in this
feature's scope).

**Side effects**: creates one `DeveloperFeedback` row. Does not itself emit an `IncidentEvent` — the
PRD ties event emission to approve/reject (AR-8) specifically, not to every feedback submission.
