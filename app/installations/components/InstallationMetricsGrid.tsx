import type { InstallationMetrics } from "../config/installationsPageConfig";

type MetricCardProps = {
  label: string;
  value: number;
  detail: string;
  icon: string;
};

function MetricCard({ label, value, detail, icon }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-50 text-lg">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-600">{label}</p>

          <p className="mt-1 text-2xl font-semibold leading-none text-slate-950">
            {value}
          </p>

          <p className="mt-2 truncate text-xs font-medium text-slate-500">
            {detail}
          </p>
        </div>
      </div>
    </article>
  );
}

export function InstallationMetricsGrid({
  metrics,
}: {
  metrics: InstallationMetrics;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Instalaciones"
        value={metrics.total}
        detail="Todos los registros"
        icon="🏗️"
      />

      <MetricCard
        label="Abiertas"
        value={metrics.open}
        detail="Pendientes de iniciar"
        icon="🟦"
      />

      <MetricCard
        label="En proceso"
        value={metrics.inProgress}
        detail="Trabajo activo"
        icon="🛠️"
      />

      <MetricCard
        label="Completadas"
        value={metrics.closed}
        detail="Finalizadas"
        icon="✅"
      />

      <MetricCard
        label="Canceladas"
        value={metrics.cancelled}
        detail="No ejecutadas"
        icon="⚠️"
      />
    </section>
  );
}
