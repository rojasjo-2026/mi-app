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

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
    </div>
  );
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
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Trabajos del día"
        value={loadingEvents ? "..." : selectedDateEvents.length}
        detail="Instalaciones y mantenimientos programados."
      />

      <SummaryCard
        title="Instalaciones"
        value={loadingEvents ? "..." : installations.length}
        detail="Trabajos de mayor carga operativa."
      />

      <SummaryCard
        title="Mantenimientos"
        value={loadingEvents ? "..." : maintenances.length}
        detail="Seguimientos o visitas preventivas."
      />

      <SummaryCard
        title="Capacidad"
        value={capacityValue}
        detail={capacityDescription}
      />
    </section>
  );
}
