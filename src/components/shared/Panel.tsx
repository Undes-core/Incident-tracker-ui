import type { ReactNode } from "react";
import { SectionHeader } from "./SectionHeader";

interface PanelProps {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}

// A titled slot on the Performance / Knowledge tabs. Deliberately draws no card of its own: the
// card belongs to whatever the panel's PanelBoundary renders, so an error or empty state occupies
// exactly the footprint the chart would have (Principle VIII) instead of nesting inside a frame.
export function Panel({ title, meta, children }: PanelProps) {
  return (
    <section className="mt-6">
      <SectionHeader title={title} meta={meta} />
      {children}
    </section>
  );
}
