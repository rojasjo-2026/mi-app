"use client";

import type { ReportColumn, ReportColumnKey, ReportSource } from "../types";

type ReportColumnsPanelProps = {
  source: ReportSource;
  columns: ReportColumn[];
  selectedColumns: ReportColumnKey[];
  onSelectedColumnsChange: (columns: ReportColumnKey[]) => void;
};

function getSourceLabel(source: ReportSource) {
  if (source === "clients") return "Clientes";

  return "Instalaciones";
}

export default function ReportColumnsPanel({
  source,
  columns,
  selectedColumns,
  onSelectedColumnsChange,
}: ReportColumnsPanelProps) {
  function toggleColumn(columnKey: ReportColumnKey) {
    const isSelected = selectedColumns.includes(columnKey);

    if (isSelected) {
      const nextColumns = selectedColumns.filter(
        (selectedColumn) => selectedColumn !== columnKey,
      );

      onSelectedColumnsChange(nextColumns);
      return;
    }

    onSelectedColumnsChange([...selectedColumns, columnKey]);
  }

  function selectAllColumns() {
    onSelectedColumnsChange(columns.map((column) => column.key));
  }

  function clearColumns() {
    onSelectedColumnsChange([]);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Columnas
          </p>

          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
            Campos del reporte
          </h2>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            Fuente actual: {getSourceLabel(source)}
          </p>
        </div>

        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          {selectedColumns.length}/{columns.length}
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={selectAllColumns}
          className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Todas
        </button>

        <button
          type="button"
          onClick={clearColumns}
          className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Limpiar
        </button>
      </div>

      <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {columns.map((column) => {
          const checked = selectedColumns.includes(column.key);

          return (
            <label
              key={column.key}
              className={[
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition",
                checked
                  ? "border-blue-200 bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleColumn(column.key)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">
                  {column.label}
                </span>

                <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                  {column.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {selectedColumns.length === 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          Seleccioná al menos una columna para visualizar o exportar el reporte.
        </div>
      )}
    </section>
  );
}
