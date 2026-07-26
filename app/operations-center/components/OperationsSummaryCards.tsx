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

function getRemainingCapacityLabel(params: {
  availability: AvailabilityData | null;
  loadingAvailability: boolean;
}) {
  if (params.loadingAvailability) {
    return "Calculando disponibilidad...";
  }

  if (!params.availability) {
    return "Sin evaluación disponible";
  }

  const remainingCapacity = getRemainingJobsCapacity(params.availability);

  if (remainingCapacity === null) {
    return "Sin límite diario";
  }

  if (remainingCapacity === 0) {
    return "Sin espacios disponibles";
  }

  if (remainingCapacity === 1) {
    return "1 espacio disponible";
  }

  return `${remainingCapacity} espacios disponibles`;
}

function getAvailabilityTitle(params: {
  availability: AvailabilityData | null;
  loadingAvailability: boolean;
}) {
  if (params.loadingAvailability) {
    return "Calculando disponibilidad";
  }

  if (!params.availability) {
    return "Disponibilidad sin calcular";
  }

  return params.availability.can_offer_day
    ? "Día disponible"
    : "Día no disponible";
}

function getAvailabilityDescription(params: {
  availability: AvailabilityData | null;
  loadingAvailability: boolean;
}) {
  if (params.loadingAvailability) {
    return "Se está revisando la carga operativa y las reglas configuradas.";
  }

  if (!params.availability) {
    return "No fue posible obtener la evaluación operativa de esta fecha.";
  }

  if (params.availability.reason) {
    return params.availability.reason;
  }

  return params.availability.can_offer_day
    ? "La fecha puede ofrecerse según la capacidad y las reglas configuradas."
    : "La fecha está bloqueada según las reglas operativas configuradas.";
}

function getAvailabilityClasses(params: {
  availability: AvailabilityData | null;
  loadingAvailability: boolean;
}) {
  if (params.loadingAvailability || !params.availability) {
    return {
      container: "border-slate-200 bg-slate-50",
      icon: "border-slate-300 text-slate-500",
      title: "text-slate-700",
      description: "text-slate-500",
    };
  }

  if (params.availability.can_offer_day) {
    return {
      container: "border-emerald-200 bg-emerald-50",
      icon: "border-emerald-500 text-emerald-600",
      title: "text-emerald-700",
      description: "text-emerald-700",
    };
  }

  return {
    container: "border-rose-200 bg-rose-50",
    icon: "border-rose-500 text-rose-600",
    title: "text-rose-700",
    description: "text-rose-700",
  };
}

function getConfiguredLimit(value: number | null | undefined) {
  return typeof value === "number"
    ? value.toLocaleString("es-ES")
    : "Sin límite";
}

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
    <div className="min-w-0 px-4 py-3">
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

  const remainingCapacityLabel = getRemainingCapacityLabel({
    availability,
    loadingAvailability,
  });

  const availabilityTitle = getAvailabilityTitle({
    availability,
    loadingAvailability,
  });

  const availabilityDescription = getAvailabilityDescription({
    availability,
    loadingAvailability,
  });

  const availabilityClasses = getAvailabilityClasses({
    availability,
    loadingAvailability,
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-3 xl:grid-cols-[minmax(300px,1.15fr)_minmax(0,2.85fr)]">
        <div
          className={`flex min-h-[122px] items-start gap-4 rounded-lg border px-4 py-4 ${availabilityClasses.container}`}
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-lg font-semibold ${availabilityClasses.icon}`}
          >
            {availability?.can_offer_day ? "✓" : "!"}
          </span>

          <div className="min-w-0">
            <p
              className={`text-base font-semibold ${availabilityClasses.title}`}
            >
              {availabilityTitle}
            </p>

            <p
              className={`mt-1 text-sm leading-6 ${availabilityClasses.description}`}
            >
              {availabilityDescription}
            </p>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-slate-200">
          <SummaryMetric
            title="Trabajos"
            value={loadingEvents ? "..." : selectedDateEvents.length}
          />

          <SummaryMetric
            title="Instalaciones"
            value={loadingEvents ? "..." : installations.length}
          />

          <SummaryMetric
            title="Mantenimientos"
            value={loadingEvents ? "..." : maintenances.length}
          />

          <SummaryMetric
            title="Capacidad"
            value={capacityValue}
            detail={remainingCapacityLabel}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">
          Capacidad configurada:
        </span>

        <span>
          Máx. trabajos:{" "}
          <strong className="font-semibold text-slate-900">
            {loadingAvailability
              ? "..."
              : availability
                ? getConfiguredLimit(availability.capacity.max_jobs_per_day)
                : "Sin datos"}
          </strong>
        </span>

        <span>
          Máx. instalaciones:{" "}
          <strong className="font-semibold text-slate-900">
            {loadingAvailability
              ? "..."
              : availability
                ? getConfiguredLimit(
                    availability.capacity.max_installations_per_day,
                  )
                : "Sin datos"}
          </strong>
        </span>

        <span>
          Máx. mantenimientos:{" "}
          <strong className="font-semibold text-slate-900">
            {loadingAvailability
              ? "..."
              : availability
                ? getConfiguredLimit(
                    availability.capacity.max_maintenances_per_day,
                  )
                : "Sin datos"}
          </strong>
        </span>
      </div>
    </section>
  );
}
