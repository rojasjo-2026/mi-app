import type { AvailabilityData } from "../types";

type OperationsAvailabilityPanelProps = {
  availability: AvailabilityData | null;
  loadingAvailability: boolean;
};

function getRemainingCapacity(availability: AvailabilityData) {
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

function getCapacitySummary(availability: AvailabilityData) {
  const maxJobsPerDay = availability.capacity.max_jobs_per_day;

  if (typeof maxJobsPerDay !== "number") {
    return `${availability.workload.total_jobs} trabajos · Sin límite diario`;
  }

  return `${availability.workload.total_jobs}/${maxJobsPerDay} trabajos`;
}

function getRemainingCapacityLabel(availability: AvailabilityData) {
  const remainingCapacity = getRemainingCapacity(availability);

  if (remainingCapacity === null) {
    return "Sin límite";
  }

  if (remainingCapacity === 0) {
    return "Sin espacios";
  }

  if (remainingCapacity === 1) {
    return "1 espacio";
  }

  return `${remainingCapacity} espacios`;
}

function getAvailabilityMessage(availability: AvailabilityData) {
  if (availability.reason) {
    return availability.reason;
  }

  if (availability.can_offer_day) {
    return "El día tiene disponibilidad según las reglas configuradas.";
  }

  return "El día no está disponible según las reglas configuradas.";
}

export function OperationsAvailabilityPanel({
  availability,
  loadingAvailability,
}: OperationsAvailabilityPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Disponibilidad del día
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Resumen de carga operativa y capacidad disponible para la fecha
          seleccionada.
        </p>
      </div>

      {loadingAvailability ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
          Cargando disponibilidad...
        </div>
      ) : availability ? (
        <div className="mt-4 space-y-4">
          <div
            className={`rounded-2xl border px-4 py-3 ${
              availability.can_offer_day
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <p
              className={`text-sm font-bold ${
                availability.can_offer_day
                  ? "text-emerald-700"
                  : "text-rose-700"
              }`}
            >
              {availability.can_offer_day
                ? "Día disponible"
                : "Día no disponible"}
            </p>

            <p
              className={`mt-1 text-xs leading-5 ${
                availability.can_offer_day
                  ? "text-emerald-700"
                  : "text-rose-700"
              }`}
            >
              {getAvailabilityMessage(availability)}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Capacidad</span>
              <span className="font-semibold text-slate-900">
                {getCapacitySummary(availability)}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Espacios disponibles</span>
              <span className="font-semibold text-slate-900">
                {getRemainingCapacityLabel(availability)}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Instalaciones</span>
              <span className="font-semibold text-blue-700">
                {availability.workload.total_installations}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Mantenimientos</span>
              <span className="font-semibold text-emerald-700">
                {availability.workload.total_maintenances}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Tiene instalación</span>
              <span className="font-semibold text-slate-900">
                {availability.workload.has_installation ? "Sí" : "No"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-600">
              Capacidad configurada
            </p>

            <div className="mt-2 space-y-1 text-xs leading-5 text-slate-500">
              <p>
                Máximo de trabajos:{" "}
                {availability.capacity.max_jobs_per_day ?? "Sin límite"}
              </p>

              <p>
                Máximo de instalaciones:{" "}
                {availability.capacity.max_installations_per_day ??
                  "Sin límite"}
              </p>

              <p>
                Máximo de mantenimientos:{" "}
                {availability.capacity.max_maintenances_per_day ?? "Sin límite"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
          <p className="text-sm font-semibold text-slate-700">
            No hay disponibilidad calculada.
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Revise la configuración de agenda o seleccione otra fecha para
            consultar la capacidad operativa.
          </p>
        </div>
      )}
    </div>
  );
}
