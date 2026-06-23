"use client";

import { REPORT_SOURCES } from "../config/reportBuilderConfig";
import type {
  ActiveReportSource,
  ClientReportBuilderMetadata,
  InstallationReportBuilderMetadata,
} from "../types";

type ReportSourcePanelProps = {
  source: ActiveReportSource;
  onSourceChange: (source: ActiveReportSource) => void;
  clientMetadata: ClientReportBuilderMetadata | null;
  installationMetadata: InstallationReportBuilderMetadata | null;
};

export default function ReportSourcePanel({
  source,
  onSourceChange,
  clientMetadata,
  installationMetadata,
}: ReportSourcePanelProps) {
  function getSourceCount(sourceKey: ActiveReportSource) {
    if (sourceKey === "clients") {
      return clientMetadata
        ? `${clientMetadata.clientStatuses.reduce(
            (total, option) => total + Number(option.count ?? 0),
            0,
          )} clientes`
        : "Datos reales";
    }

    return installationMetadata
      ? `${installationMetadata.counters.totalInstallations} instalaciones`
      : "Datos reales";
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Fuente del reporte
        </p>

        <h2 className="text-base font-semibold tracking-tight text-slate-950">
          Seleccioná el origen de datos
        </h2>

        <p className="text-sm leading-6 text-slate-500">
          Cada fuente usa sus propias columnas, filtros y metadata real.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {REPORT_SOURCES.map((reportSource) => {
          const isSelected = source === reportSource.key;

          return (
            <button
              key={reportSource.key}
              type="button"
              onClick={() => onSourceChange(reportSource.key)}
              className={[
                "rounded-lg border p-4 text-left transition",
                isSelected
                  ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-950">
                  {reportSource.title}
                </h3>

                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                    isSelected
                      ? "bg-blue-100 text-blue-700 ring-blue-200"
                      : "bg-slate-50 text-slate-600 ring-slate-200",
                  ].join(" ")}
                >
                  {reportSource.badge}
                </span>
              </div>

              <p className="mt-2 text-sm leading-5 text-slate-500">
                {reportSource.description}
              </p>

              <p className="mt-3 text-xs font-semibold text-slate-500">
                {getSourceCount(reportSource.key)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
