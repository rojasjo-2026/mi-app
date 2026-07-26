"use client";

import { REPORT_SOURCES } from "../config/reportBuilderConfig";
import type {
  ActiveReportSource,
  ClientReportBuilderMetadata,
  FollowUpReportBuilderMetadata,
  InstallationReportBuilderMetadata,
} from "../types";

type ReportSourcePanelProps = {
  source: ActiveReportSource;
  onSourceChange: (source: ActiveReportSource) => void;
  clientMetadata: ClientReportBuilderMetadata | null;
  installationMetadata: InstallationReportBuilderMetadata | null;
  followUpMetadata: FollowUpReportBuilderMetadata | null;
};

export default function ReportSourcePanel({
  source,
  onSourceChange,
  clientMetadata,
  installationMetadata,
  followUpMetadata,
}: ReportSourcePanelProps) {
  function getSourceCount(sourceKey: ActiveReportSource) {
    if (sourceKey === "clients") {
      return clientMetadata
        ? clientMetadata.clientStatuses.reduce(
            (total, option) => total + Number(option.count ?? 0),
            0,
          )
        : null;
    }

    if (sourceKey === "installations") {
      return installationMetadata?.counters.totalInstallations ?? null;
    }

    return followUpMetadata?.counters.totalFollowUps ?? null;
  }

  function getSourceCountLabel(sourceKey: ActiveReportSource) {
    const count = getSourceCount(sourceKey);

    if (count === null) {
      return "Cargando...";
    }

    return `${count.toLocaleString("es")} ${
      count === 1 ? "registro" : "registros"
    }`;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Fuente del reporte
          </p>

          <p className="mt-0.5 text-sm text-slate-500">
            Seleccioná el origen de los datos.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {REPORT_SOURCES.map((reportSource) => {
          const isSelected = source === reportSource.key;

          return (
            <button
              key={reportSource.key}
              type="button"
              onClick={() => onSourceChange(reportSource.key)}
              aria-pressed={isSelected}
              className={[
                "flex h-16 min-w-[220px] flex-1 items-center justify-between gap-3 rounded-md border px-3 text-left transition",
                isSelected
                  ? "border-blue-300 bg-blue-50 ring-1 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-950">
                  {reportSource.title}
                </span>

                <span className="mt-1 block text-xs font-medium text-slate-500">
                  {getSourceCountLabel(reportSource.key)}
                </span>
              </span>

              <span
                aria-hidden="true"
                className={[
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  isSelected ? "bg-blue-600" : "bg-slate-300",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
