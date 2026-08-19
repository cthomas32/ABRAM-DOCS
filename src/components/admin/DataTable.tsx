"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Columns3 } from "lucide-react";

/**
 * The master spreadsheet.
 *
 * One dense table, used by both objects that have hundreds of rows. The
 * founder's word for what was wanted was "spreadsheet", and the reason a
 * spreadsheet is the right shape here is that the questions asked of a
 * pipeline are comparisons: who has not been touched, which of these is
 * worth the most, whose are they. A card answers one record beautifully
 * and a hundred records badly.
 *
 * What it deliberately is not: a virtualised grid. At the size this
 * console holds — two thousand people, a few hundred deals — windowing
 * costs a scroll position, a sticky header fight and a class of bug that
 * only appears on somebody else's laptop, and buys nothing a person can
 * feel. The header is sticky, the body is the browser's own scrolling,
 * and rows are capped rather than windowed.
 *
 * Selection, sorting and the column chooser live here. Everything about
 * what a cell *means* lives in the column definition the caller passes,
 * so this file knows nothing about people or deals.
 */

export interface Column<Row> {
  id: string;
  label: string;
  /** The cell. Anything: a chip, a select, a link. */
  render: (row: Row) => React.ReactNode;
  /** What to sort on. Absent means the column does not sort. */
  sortValue?: (row: Row) => string | number;
  /** Right aligned, for figures. */
  numeric?: boolean;
  /** Shown unless the reader turns it off. */
  defaultOn?: boolean;
  /** Never hidden, never listed in the chooser. The name column. */
  fixed?: boolean;
  className?: string;
}

export interface DataTableProps<Row> {
  rows: Row[];
  columns: Column<Row>[];
  rowId: (row: Row) => string;
  onOpen?: (row: Row) => void;
  /** Selection is off entirely when this is absent. */
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
  /** Drawn above the table when there are no rows. */
  empty?: React.ReactNode;
  /** Past this the table stops drawing and says so. */
  limit?: number;
  /** Persists the chosen columns under this key. */
  storageKey?: string;
}

function readStoredColumns(key: string | undefined, fallback: string[]): string[] {
  if (!key || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`abram.columns.${key}`);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every((entry) => typeof entry === "string")
      ? parsed
      : fallback;
  } catch {
    // A broken or blocked storage costs the reader their column choice
    // and nothing else.
    return fallback;
  }
}

export default function DataTable<Row>({
  rows,
  columns,
  rowId,
  onOpen,
  selected,
  onSelectedChange,
  empty,
  limit = 500,
  storageKey,
}: DataTableProps<Row>) {
  const defaults = useMemo(
    () => columns.filter((column) => column.fixed || column.defaultOn !== false).map((c) => c.id),
    [columns]
  );

  const [shown, setShown] = useState<string[]>(() => readStoredColumns(storageKey, defaults));
  const [chooserOpen, setChooserOpen] = useState(false);
  const [sort, setSort] = useState<{ id: string; direction: "asc" | "desc" } | null>(null);

  const visible = columns.filter((column) => column.fixed || shown.includes(column.id));

  const toggleColumn = (id: string) => {
    const next = shown.includes(id) ? shown.filter((entry) => entry !== id) : [...shown, id];
    setShown(next);
    if (storageKey && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(`abram.columns.${storageKey}`, JSON.stringify(next));
      } catch {
        // Storage refused. The choice holds for this visit.
      }
    }
  };

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((entry) => entry.id === sort.id);
    if (!column?.sortValue) return rows;

    const direction = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
      return String(left).localeCompare(String(right)) * direction;
    });
  }, [rows, sort, columns]);

  const drawn = sorted.slice(0, limit);
  const allDrawnSelected =
    selected !== undefined && drawn.length > 0 && drawn.every((row) => selected.has(rowId(row)));

  const toggleAll = () => {
    if (!onSelectedChange || selected === undefined) return;
    const next = new Set(selected);
    if (allDrawnSelected) for (const row of drawn) next.delete(rowId(row));
    else for (const row of drawn) next.add(rowId(row));
    onSelectedChange(next);
  };

  if (rows.length === 0) return <>{empty}</>;

  return (
    <div className="space-y-2">
      {/* The column chooser. One control, not a settings screen. */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-zinc-400 tabular-nums">
          {drawn.length < rows.length
            ? `${drawn.length} of ${rows.length} shown. Narrow the filters to see the rest.`
            : `${rows.length} ${rows.length === 1 ? "row" : "rows"}`}
        </span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setChooserOpen((open) => !open)}
            aria-expanded={chooserOpen}
            className="btn-glass px-3 h-9 text-[11px] font-medium rounded-full"
          >
            <Columns3 className="w-3.5 h-3.5" />
            Columns
          </button>

          {chooserOpen && (
            <div className="absolute right-0 top-10 z-20 w-56 rounded-xl border border-white/10 bg-zinc-950 p-2 shadow-xl">
              {columns
                .filter((column) => !column.fixed)
                .map((column) => (
                  <button
                    key={column.id}
                    type="button"
                    onClick={() => toggleColumn(column.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-zinc-300 hover:bg-white/[0.04]"
                  >
                    <span className="w-3.5 shrink-0">
                      {shown.includes(column.id) && <Check className="h-3 w-3 text-white" />}
                    </span>
                    {column.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10">
            <tr className="bg-zinc-950">
              {selected !== undefined && (
                <th className="w-9 px-3 py-2.5 bg-white/[0.03]">
                  <input
                    type="checkbox"
                    checked={allDrawnSelected}
                    onChange={toggleAll}
                    aria-label="Select every row shown"
                    className="h-3.5 w-3.5 accent-white cursor-pointer"
                  />
                </th>
              )}
              {visible.map((column) => {
                const active = sort?.id === column.id;
                return (
                  <th
                    key={column.id}
                    className={`px-3 py-2.5 bg-white/[0.03] text-xs uppercase font-bold tracking-widest text-zinc-400 whitespace-nowrap ${
                      column.numeric ? "text-right" : ""
                    }`}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSort(
                            active && sort.direction === "asc"
                              ? { id: column.id, direction: "desc" }
                              : { id: column.id, direction: "asc" }
                          )
                        }
                        className={`inline-flex items-center gap-1 ${
                          active ? "text-white" : "hover:text-zinc-200"
                        }`}
                      >
                        {column.label}
                        {active &&
                          (sort.direction === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {drawn.map((row) => {
              const id = rowId(row);
              const isSelected = selected?.has(id) ?? false;
              return (
                <tr
                  key={id}
                  className={`border-t border-white/5 transition-colors ${
                    isSelected ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {selected !== undefined && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (!onSelectedChange) return;
                          const next = new Set(selected);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          onSelectedChange(next);
                        }}
                        aria-label="Select this row"
                        className="h-3.5 w-3.5 accent-white cursor-pointer"
                      />
                    </td>
                  )}
                  {visible.map((column) => (
                    <td
                      key={column.id}
                      onClick={
                        // The name column opens the record. Every other
                        // cell is left alone, because a cell holding a
                        // select must not also be a navigation.
                        column.fixed && onOpen ? () => onOpen(row) : undefined
                      }
                      className={`px-3 py-2 text-xs text-zinc-300 align-middle ${
                        column.numeric ? "text-right tabular-nums" : ""
                      } ${column.fixed && onOpen ? "cursor-pointer" : ""} ${column.className ?? ""}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * What to do with what is ticked.
 *
 * Appears only when something is, and says how many, because a bulk
 * action whose scope is invisible is one nobody presses twice.
 */
export function BulkBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5">
      <span className="text-xs text-white tabular-nums">
        {count} selected
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <button
        type="button"
        onClick={onClear}
        className="btn-ghost ml-auto px-3 h-9 text-[11px] font-medium rounded-full"
      >
        Clear
      </button>
    </div>
  );
}
