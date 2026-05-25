import type { CalendarEvent } from "../types";
import { getEventBadgeClasses, getEventTypeLabel } from "../utils";

type OperationsWorkListProps = {
  selectedDateEvents: CalendarEvent[];
  loadingEvents: boolean;
  onRefresh: () => void;
};

export function OperationsWorkList({
  selectedDateEvents,
  loadingEvents,
  onRefresh,
}: OperationsWorkListProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Trabajos para visitar
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Lista operativa para la fecha seleccionada.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
        >
          Refrescar
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {loadingEvents ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Cargando trabajos...
          </div>
        ) : selectedDateEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            No hay trabajos programados para esta fecha.
          </div>
        ) : (
          selectedDateEvents.map((event, index) => (
            <div
              key={event.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      #{index + 1}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getEventBadgeClasses(
                        event,
                      )}`}
                    >
                      {getEventTypeLabel(event)}
                    </span>

                    {event.priority ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Prioridad: {event.priority}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm font-bold text-slate-900">
                    {event.title}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {event.description || "Sin descripción registrada."}
                  </p>

                  {event.status ? (
                    <p className="mt-1 text-xs text-slate-400">
                      Estado: {event.status}
                    </p>
                  ) : null}
                </div>

                {event.billing_status ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {event.billing_status}
                  </span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
