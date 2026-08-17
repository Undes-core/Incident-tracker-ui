import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExecutionOutcomeDonut } from "./ExecutionOutcomeDonut";
import type { PerformanceOutcomes } from "../../api/dashboard/performance";

const outcomes: PerformanceOutcomes = {
  counts: { success: 71, failed: 6, rolledBack: 3, running: 2 },
  successRatePercent: 87,
  medianDurationMinutes: 4,
  byActionType: [],
  recentFailures: [],
};

describe("ExecutionOutcomeDonut", () => {
  it("shows the success rate as the centre label (FR-090)", () => {
    render(<ExecutionOutcomeDonut outcomes={outcomes} />);
    expect(screen.getByText(/success rate/i)).toHaveTextContent("87%");
  });

  it("counts and displays rolled-back separately from both success and failed everywhere (FR-091,EO-1)", () => {
    render(<ExecutionOutcomeDonut outcomes={outcomes} />);
    expect(screen.getByText("ROLLED BACK")).toBeInTheDocument();
    const rolledBackRow = screen.getByText("ROLLED BACK").closest("li");
    expect(rolledBackRow).toHaveTextContent("3");

    const failedRow = screen.getByText("FAILED").closest("li");
    expect(failedRow).toHaveTextContent("6");
    expect(failedRow).not.toHaveTextContent("9"); // never 6+3 folded together
  });

  it("never folds rolled-back into the failed count", () => {
    render(<ExecutionOutcomeDonut outcomes={outcomes} />);
    const counts = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(counts.some((text) => text?.includes("FAILED") && text.includes("6"))).toBe(true);
    expect(counts.some((text) => text?.includes("ROLLED BACK") && text.includes("3"))).toBe(true);
  });
});
