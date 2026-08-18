import { useState } from "react";

interface Column<T> {
  key: keyof T;
  label: string;
}

interface AccessibleChartTableProps<T> {
  caption: string;
  columns: readonly Column<T>[];
  rows: readonly T[];
}

// A11Y-4: every chart offers an accessible tabular equivalent, fed the same domain-computed
// series as its chart sibling, toggled visible rather than always shown.
export function AccessibleChartTable<T extends Record<string, unknown>>({
  caption,
  columns,
  rows,
}: AccessibleChartTableProps<T>) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <button aria-expanded={visible} onClick={() => setVisible((v) => !v)}>
        {visible ? "Hide table view" : "View as table"}
      </button>
      {visible && (
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={String(column.key)}>{String(row[column.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
