import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";
import { DashboardHeader } from "./DashboardHeader";
import { OperatorProvider } from "../../state/OperatorContext";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
});

function renderHeader() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <OperatorProvider>
        <DashboardHeader />
      </OperatorProvider>
    </QueryClientProvider>,
  );
}

describe("DashboardHeader", () => {
  it("defaults to the 7d time range and marks it pressed", () => {
    renderHeader();
    expect(screen.getByRole("button", { name: "7d" })).toHaveAttribute("aria-pressed", "true");
  });

  it("updates the URL when a different time range is selected", () => {
    renderHeader();
    fireEvent.click(screen.getByRole("button", { name: "30d" }));
    expect(new URLSearchParams(window.location.search).get("range")).toBe("30d");
    expect(screen.getByRole("button", { name: "30d" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "7d" })).toHaveAttribute("aria-pressed", "false");
  });

  it("explains via a tooltip that the range does not apply to Now or the alert strip (FR-004)", () => {
    renderHeader();
    const help = screen.getByRole("button", { name: /about the time range/i });
    expect(help.title || help.getAttribute("data-tip")).toMatch(/now/i);
  });

  it("defaults the environment select to Production", () => {
    renderHeader();
    const select = screen.getByLabelText<HTMLSelectElement>(/environment/i);
    expect(Array.from(select.selectedOptions).map((o) => o.value)).toEqual(["Production"]);
  });

  it("offers a service dropdown defaulting to all services (FR-003)", () => {
    renderHeader();
    const select = screen.getByLabelText<HTMLSelectElement>(/^service$/i);
    expect(select.value).toBe("all");
    fireEvent.change(select, { target: { value: "svc-payments-api" } });
    expect(new URLSearchParams(window.location.search).get("service")).toBe("svc-payments-api");
  });

  it("shows a live indicator and a manual refresh control", () => {
    renderHeader();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  describe("operator name (FR-121)", () => {
    it("shows that no name is set and offers to set one when none exists", () => {
      renderHeader();
      expect(screen.getByText(/name not set/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /set name/i })).toBeInTheDocument();
    });

    it("can set a name, which then displays and persists", () => {
      renderHeader();
      fireEvent.click(screen.getByRole("button", { name: /set name/i }));
      fireEvent.change(screen.getByRole("textbox", { name: /your name/i }), { target: { value: "a.reyes" } });
      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

      expect(screen.getByText("a.reyes")).toBeInTheDocument();
      expect(window.localStorage.getItem("incident-tracker:operator-name")).toBe("a.reyes");
    });

    it("shows the existing name and offers to change it", () => {
      window.localStorage.setItem("incident-tracker:operator-name", "a.reyes");
      renderHeader();

      expect(screen.getByText("a.reyes")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /change name/i }));
      fireEvent.change(screen.getByRole("textbox", { name: /your name/i }), { target: { value: "j.chen" } });
      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

      expect(screen.getByText("j.chen")).toBeInTheDocument();
    });
  });
});
