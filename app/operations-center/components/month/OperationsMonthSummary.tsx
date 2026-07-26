type OperationsMonthSummaryProps = {
  monthLabel: string;
  totalJobs: number;
  totalInstallations: number;
  totalMaintenances: number;
  blockedDays: number;
  averageLoadPercentage: number | null;
  totalWorkload: number;
  totalCapacity: number;
  loadingEvents: boolean;
  loadingAvailability: boolean;
};

function SummaryMetric({
  value,
  label,
  detail,
}: {
  value: string | number;
  label: string;
  detail?: string;
}) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>

      {detail ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
      ) : null}
    </div>
  );
}

export function OperationsMonthSummary({
  monthLabel,
  totalJobs,
  totalInstallations,
  totalMaintenances,
  blockedDays,
  averageLoadPercentage,
  totalWorkload,
  totalCapacity,
  loadingEvents,
  loadingAvailability,
}: OperationsMonthSummaryProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-950">
          Resumen de {monthLabel}
        </h2>
      </div>

      <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
        <SummaryMetric
          value={loadingEvents ? "..." : totalJobs}
          label="Total trabajos"
        />

        <SummaryMetric
          value={loadingEvents ? "..." : totalInstallations}
          label="Instalaciones"
        />

        <SummaryMetric
          value={loadingEvents ? "..." : totalMaintenances}
          label="Mantenimientos"
        />

        <SummaryMetric
          value={loadingAvailability ? "..." : blockedDays}
          label="Días bloqueados"
        />

        <SummaryMetric
          value={
            loadingAvailability
              ? "..."
              : averageLoadPercentage === null
                ? "Sin datos"
                : `${averageLoadPercentage}%`
          }
          label="Carga mensual promedio"
          detail={
            totalCapacity > 0
              ? `${totalWorkload}/${totalCapacity} trabajos evaluados`
              : "Sin capacidad numérica evaluada"
          }
        />
      </div>
    </section>
  );
}
