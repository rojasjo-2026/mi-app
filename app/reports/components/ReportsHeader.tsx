"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { REPORT_SOURCES } from "../config/reportBuilderConfig";
import type { ActiveReportSource } from "../types";

type ReportsHeaderProps = {
  source: ActiveReportSource;
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
  const { businessCountryMeta } = useAppSettings();
  const locale = businessCountryMeta.locale || "es";

  const activeSource = REPORT_SOURCES.find(
    (reportSource) => reportSource.key === source,
  );

  return (
    <header className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Report Builder
          </h1>

          <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">
            {activeSource?.description ??
              "Generá reportes personalizados utilizando datos reales."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 flex items-center divide-x divide-slate-200">
            <div className="min-w-[76px] px-3 text-center">
              <p className="text-lg font-semibold leading-5 text-slate-950">
                {totalItems.toLocaleString(locale)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Registros</p>
            </div>

            <div className="min-w-[76px] px-3 text-center">
              <p className="text-lg font-semibold leading-5 text-slate-950">
                {selectedColumnCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">Columnas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            disabled={loading || exportingExcel || selectedColumnCount === 0}
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="mt-3 flex items-start gap-2 border-t border-amber-100 pt-3 text-xs font-medium text-amber-700">
          <span
            aria-hidden="true"
            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400"
          />

          <p>
            Para exportar PDF, seleccioná máximo 8 columnas. Excel sí permite
            más columnas.
          </p>
        </div>
      )}
    </header>
  );
}
