import type { AvailabilityData, CalendarEvent } from "../types";

type OperationsSummaryCardsProps = {
  selectedDateEvents: CalendarEvent[];
  installations: CalendarEvent[];
  maintenances: CalendarEvent[];
  availability: AvailabilityData | null;
  loadingEvents: boolean;
  loadingAvailability: boolean;
};

function getRemainingJobsCapacity(availability: AvailabilityData | null) {
  if (!availability) {
    return null;
  }

  const configuredRemaining = availability.capacity.remaining_jobs_capacity;

  if (typeof configuredRemaining === "number") {
    return Math.max(0, configuredRemaining);
  }

  const maxJobsPerDay = availability.capacity.max_jobs_per_day;

  if (typeof maxJobsPerDay !== "number") {
    return null;
  }

  return Math.max(0, maxJobsPerDay - availability.workload.total_jobs);
}

function getCapacityValue(params: {
  availability: AvailabilityData | null;
  loadingAvailability: boolean;
}) {
  if (params.loadingAvailability) {
    return "...";
  }

  if (!params.availability) {
    return "Sin datos";
  }

  const maxJobsPerDay = params.availability.capacity.max_jobs_per_day;

  if (typeof maxJobsPerDay !== "number") {
    return "Sin límite";
  }

  return `${params.availability.workload.total_jobs}/${maxJobsPerDay}`;
}

function getCapacityDescription(params: {
  availability: AvailabilityData | null;
  loadingAvailability: boolean;
}) {
  if (params.loadingAvailability) {
    return "Calculando disponibilidad operativa.";
  }

  if (!params.availability) {
    return "Sin evaluación disponible.";
  }

  const maxJobsPerDay = params.availability.capacity.max_jobs_per_day;
  const remainingJobsCapacity = getRemainingJobsCapacity(params.availability);

  if (typeof maxJobsPerDay !== "number") {
    return params.availability.can_offer_day
      ? "Día disponible sin límite configurado."
      : params.availability.reason || "Día no disponible según reglas.";
  }

  if (!params.availability.can_offer_day) {
    return params.availability.reason || "Día no disponible según reglas.";
  }

  if (remainingJobsCapacity === 0) {
    return "Sin espacios disponibles.";
  }

  if (remainingJobsCapacity === 1) {
    return "1 espacio disponible.";
  }

  return `${remainingJobsCapacity} espacios disponibles.`;
}

export function OperationsSummaryCards({
  selectedDateEvents,
  installations,
  maintenances,
  availability,
  loadingEvents,
  loadingAvailability,
}: OperationsSummaryCardsProps) {
  const capacityValue = getCapacityValue({
    availability,
    loadingAvailability,
  });

  const capacityDescription = getCapacityDescription({
    availability,
    loadingAvailability,
  });

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
          {capacityValue}
        </p>

        <p className="mt-1 text-xs text-slate-400">{capacityDescription}</p>
      </div>
    </section>
  );
}
