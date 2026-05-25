import type { AvailabilityData } from "../types";

type OperationsAvailabilityPanelProps = {
  availability: AvailabilityData | null;
  loadingAvailability: boolean;
};

export function OperationsAvailabilityPanel({
  availability,
  loadingAvailability,
}: OperationsAvailabilityPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Disponibilidad del día
      </h2>

      {loadingAvailability ? (
        <p className="mt-3 text-sm text-slate-500">
          Cargando disponibilidad...
        </p>
      ) : availability ? (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Trabajos</span>
            <span className="font-semibold text-slate-900">
              {availability.workload.total_jobs}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500">Espacios</span>
            <span className="font-semibold text-slate-900">
              {availability.capacity.remaining_jobs_capacity ?? "N/A"}
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

          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
              availability.can_offer_day
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {availability.can_offer_day
              ? "Día disponible"
              : "Día no disponible"}
          </div>

          {availability.reason ? (
            <p className="text-xs leading-5 text-slate-500">
              {availability.reason}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No hay disponibilidad calculada.
        </p>
      )}
    </div>
  );
}
