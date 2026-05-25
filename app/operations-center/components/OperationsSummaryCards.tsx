import type { AvailabilityData, CalendarEvent } from "../types";

type OperationsSummaryCardsProps = {
  selectedDateEvents: CalendarEvent[];
  installations: CalendarEvent[];
  maintenances: CalendarEvent[];
  availability: AvailabilityData | null;
  loadingEvents: boolean;
  loadingAvailability: boolean;
};

export function OperationsSummaryCards({
  selectedDateEvents,
  installations,
  maintenances,
  availability,
  loadingEvents,
  loadingAvailability,
}: OperationsSummaryCardsProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Trabajos del día</p>

        <p className="mt-2 text-3xl font-bold text-slate-900">
          {loadingEvents ? "..." : selectedDateEvents.length}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Instalaciones y mantenimientos programados.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Instalaciones</p>

        <p className="mt-2 text-3xl font-bold text-blue-700">
          {loadingEvents ? "..." : installations.length}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Trabajos de mayor carga operativa.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Mantenimientos</p>

        <p className="mt-2 text-3xl font-bold text-emerald-700">
          {loadingEvents ? "..." : maintenances.length}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Seguimientos o visitas preventivas.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Capacidad</p>

        <p className="mt-2 text-3xl font-bold text-slate-900">
          {loadingAvailability
            ? "..."
            : availability?.capacity.max_jobs_per_day
              ? `${availability.workload.total_jobs}/${availability.capacity.max_jobs_per_day}`
              : "Sin límite"}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {availability?.can_offer_day
            ? "Día disponible según reglas."
            : availability?.reason || "Sin evaluación disponible."}
        </p>
      </div>
    </section>
  );
}
