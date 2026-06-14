"use client";

import type { ReportSource } from "../types";

type ReportsHeaderProps = {
  source: ReportSource;
  loading: boolean;
  exportingExcel: boolean;
  exportingPdf: boolean;
  totalItems: number;
  selectedColumnCount: number;
  canExportPdf: boolean;
  onRefresh: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
};

function getSourceLabel(source: ReportSource) {
  if (source === "clients") return "Clientes";

  return "Instalaciones";
}

function getSourceDescription(source: ReportSource) {
  if (source === "clients") {
    return "Generá reportes de clientes con contacto, ubicación, actividad y facturación.";
  }

  return "Generá reportes de instalaciones con estados, técnicos, servicios, ubicación y facturación.";
}

export default function ReportsHeader({
  source,
  loading,
  exportingExcel,
  exportingPdf,
  totalItems,
  selectedColumnCount,
  canExportPdf,
  onRefresh,
  onExportExcel,
  onExportPdf,
}: ReportsHeaderProps) {
  return (
    <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Centro de reportes
            </p>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
              {getSourceLabel(source)}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Report Builder
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {getSourceDescription(source)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Registros
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {totalItems.toLocaleString("es-CR")}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Columnas
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {selectedColumnCount}
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            disabled={loading || exportingExcel || selectedColumnCount === 0}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {exportingExcel ? "Exportando..." : "Exportar Excel"}
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            disabled={
              loading ||
              exportingPdf ||
              selectedColumnCount === 0 ||
              !canExportPdf
            }
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            title={
              canExportPdf
                ? "Exportar PDF"
                : "PDF disponible solo con 8 columnas o menos"
            }
          >
            {exportingPdf ? "Exportando..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      {!canExportPdf && selectedColumnCount > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          Para exportar PDF, seleccioná máximo 8 columnas. Excel sí permite más
          columnas.
        </div>
      )}
    </header>
  );
}
