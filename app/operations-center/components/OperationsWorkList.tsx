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
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Trabajos para visitar
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Lista operativa para la fecha seleccionada.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Refrescar
        </button>
      </div>

      <div className="divide-y divide-slate-200">
        {loadingEvents ? (
          <div className="px-4 py-4 text-sm text-slate-500">
            Cargando trabajos...
          </div>
        ) : selectedDateEvents.length === 0 ? (
          <div className="px-4 py-5">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
              <p className="text-sm font-semibold text-slate-700">
                No hay trabajos programados para esta fecha.
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Puede revisar otra fecha o programar instalaciones y
                mantenimientos desde el calendario.
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                Cuando existan trabajos programados, aparecerán aquí como lista
                operativa para preparar visitas y rutas.
              </p>
            </div>
          </div>
        ) : (
          selectedDateEvents.map((event, index) => (
            <div key={event.id} className="px-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
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

                  <p className="mt-3 text-sm font-semibold text-slate-950">
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
