import type { CalendarEvent, OperationsZoneGroup } from "../types";

type OperationsZoneGroupsProps = {
  selectedDateEvents: CalendarEvent[];
  onUseGroupAsRoute?: (routeStops: string[]) => void;
};

function buildZoneGroups(events: CalendarEvent[]): OperationsZoneGroup[] {
  const groups = new Map<string, OperationsZoneGroup>();

  events.forEach((event) => {
    const zoneKey = event.operational_zone_id || "NO_ZONE";
    const zoneName = event.operational_zone_name || "Sin agrupación asignada";
    const referenceAddress = event.operational_zone_reference_address || null;

    if (!groups.has(zoneKey)) {
      groups.set(zoneKey, {
        zone_id: event.operational_zone_id || null,
        zone_name: zoneName,
        reference_address: referenceAddress,
        events: [],
        total_jobs: 0,
        total_installations: 0,
        total_maintenances: 0,
        route_stops: [],
      });
    }

    const group = groups.get(zoneKey);

    if (!group) return;

    group.events.push(event);
    group.total_jobs += 1;

    if (event.entity_type === "installation") {
      group.total_installations += 1;
    }

    if (event.entity_type === "follow_up") {
      group.total_maintenances += 1;
    }

    if (event.route_address) {
      group.route_stops.push(event.route_address);
    }
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.zone_id === null) return 1;
    if (b.zone_id === null) return -1;

    return b.total_jobs - a.total_jobs;
  });
}

export function OperationsZoneGroups({
  selectedDateEvents,
  onUseGroupAsRoute,
}: OperationsZoneGroupsProps) {
  const zoneGroups = buildZoneGroups(selectedDateEvents);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Agrupaciones operativas del día
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Trabajos organizados según las zonas o rutas configuradas por el
          usuario para la fecha seleccionada.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {zoneGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            No hay trabajos programados para agrupar en esta fecha.
          </div>
        ) : (
          zoneGroups.map((group) => (
            <div
              key={group.zone_id || "NO_ZONE"}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {group.zone_name}
                    </p>

                    {group.zone_id ? (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Ruta configurada
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Sin zona
                      </span>
                    )}
                  </div>

                  {group.reference_address ? (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Referencia: {group.reference_address}
                    </p>
                  ) : null}

                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-slate-400">Trabajos</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {group.total_jobs}
                      </p>
                    </div>

                    <div className="rounded-xl border border-blue-200 bg-white px-3 py-2">
                      <p className="text-slate-400">Instalaciones</p>
                      <p className="mt-1 font-bold text-blue-700">
                        {group.total_installations}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
                      <p className="text-slate-400">Mantenimientos</p>
                      <p className="mt-1 font-bold text-emerald-700">
                        {group.total_maintenances}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    {group.events.slice(0, 4).map((event) => (
                      <p
                        key={event.id}
                        className="text-xs leading-5 text-slate-500"
                      >
                        {event.title}
                      </p>
                    ))}

                    {group.events.length > 4 ? (
                      <p className="text-xs font-semibold text-slate-400">
                        +{group.events.length - 4} trabajos más
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:min-w-52">
                  <button
                    type="button"
                    onClick={() => onUseGroupAsRoute?.(group.route_stops)}
                    disabled={
                      !onUseGroupAsRoute || group.route_stops.length === 0
                    }
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Usar esta agrupación como ruta
                  </button>

                  <p className="text-xs leading-5 text-slate-400">
                    Paradas disponibles: {group.route_stops.length}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
