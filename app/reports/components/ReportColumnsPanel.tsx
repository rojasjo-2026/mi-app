"use client";

import { CLIENT_COLUMNS } from "../config/reportBuilderConfig";
import type { ClientColumnKey } from "../types";

type ReportColumnsPanelProps = {
  selectedColumns: ClientColumnKey[];
  onToggleColumn: (columnKey: ClientColumnKey) => void;
};

export default function ReportColumnsPanel({
  selectedColumns,
  onToggleColumn,
}: ReportColumnsPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Columnas
          </p>

          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
            Campos para exportar
          </h2>
        </div>

        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-100">
          {selectedColumns.length}
        </span>
      </div>

      <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {CLIENT_COLUMNS.map((column) => {
          const checked = selectedColumns.includes(column.key);

          return (
            <label
              key={column.key}
              className={[
                "flex cursor-pointer gap-3 rounded-md border px-3 py-2.5 transition",
                checked
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleColumn(column.key)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  {column.label}
                </span>
                <span className="block text-xs leading-5 text-slate-500">
                  {column.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
