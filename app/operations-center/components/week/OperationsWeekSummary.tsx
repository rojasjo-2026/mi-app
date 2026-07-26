import type { OperationsWeekSummary as OperationsWeekSummaryType } from "./types";

type OperationsWeekSummaryProps = {
  summary: OperationsWeekSummaryType;
};

function SummaryMetric({
  title,
  value,
  detail,
}: {
  title: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{title}</p>
      {detail ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
      ) : null}
    </div>
  );
}

function formatAverageLoad(summary: OperationsWeekSummaryType) {
  if (summary.averageWeeklyLoadPct === null) {
    return "Sin evaluación";
  }

  return `${Math.round(summary.averageWeeklyLoadPct)}%`;
}

function formatAverageLoadDetail(summary: OperationsWeekSummaryType) {
  if (summary.averageWeeklyLoadSampleSize === 0) {
    return "Se calcula solo con días evaluados que tengan límite diario.";
  }

  return `Promedio sobre ${summary.averageWeeklyLoadSampleSize} día(s) con límite diario.`;
}

export function OperationsWeekSummary({ summary }: OperationsWeekSummaryProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryMetric title="Total de trabajos" value={summary.totalJobs} />

      <SummaryMetric
        title="Días con actividad"
        value={summary.daysWithActivity}
      />

      <SummaryMetric title="Días bloqueados" value={summary.blockedDays} />

      <SummaryMetric
        title="Carga semanal promedio"
        value={formatAverageLoad(summary)}
        detail={formatAverageLoadDetail(summary)}
      />
    </section>
  );
}
