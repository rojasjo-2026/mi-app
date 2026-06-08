import type { FollowUpMetrics } from "../types/followUpsPageTypes";
import { MetricCard } from "./MetricCard";

type FollowUpMetricsGridProps = {
  metrics: FollowUpMetrics;
};

export function FollowUpMetricsGrid({ metrics }: FollowUpMetricsGridProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <MetricCard
        title="Total"
        value={metrics.total}
        detail="Registrados"
        accentClass="text-slate-950"
        bgClass="border-slate-200 bg-white text-slate-600"
        icon="🔧"
      />

      <MetricCard
        title="Pendientes"
        value={metrics.pending}
        detail="En seguimiento"
        accentClass="text-blue-800"
        bgClass="border-blue-200 bg-blue-50 text-blue-700"
        icon="📌"
      />

      <MetricCard
        title="Atrasados"
        value={metrics.overdue}
        detail="Atención urgente"
        accentClass="text-red-800"
        bgClass="border-red-200 bg-red-50 text-red-700"
        icon="⚠️"
      />

      <MetricCard
        title="Hoy"
        value={metrics.today}
        detail="Para revisar"
        accentClass="text-amber-800"
        bgClass="border-amber-200 bg-amber-50 text-amber-700"
        icon="📅"
      />

      <MetricCard
        title="Facturación"
        value={metrics.pendingBilling}
        detail="Pendientes"
        accentClass="text-violet-800"
        bgClass="border-violet-200 bg-violet-50 text-violet-700"
        icon="₡"
      />

      <MetricCard
        title="Cerrados"
        value={metrics.completed}
        detail="Completados"
        accentClass="text-emerald-800"
        bgClass="border-emerald-200 bg-emerald-50 text-emerald-700"
        icon="✅"
      />
    </section>
  );
}
