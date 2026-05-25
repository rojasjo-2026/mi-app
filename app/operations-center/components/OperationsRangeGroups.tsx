import type { CalendarEvent, OperationsViewMode } from "../types";

type OperationsRangeGroupsProps = {
  events: CalendarEvent[];
  selectedDate: string;
  viewMode: OperationsViewMode;
  onUseGroupAsRoute?: (routeStops: string[]) => void;
};

type RangeGroup = {
  zoneKey: string;
  zoneName: string;
  referenceAddress: string | null;
  dates: Map<
    string,
    {
      events: CalendarEvent[];
      total_installations: number;
      total_maintenances: number;
      route_stops: string[];
    }
  >;
  total_jobs: number;
  total_installations: number;
  total_maintenances: number;
  route_stops: string[];
};

function parseDateOnly(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekRange(dateValue: string) {
  const date = parseDateOnly(dateValue);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const start = new Date(date);
  start.setDate(date.getDate() + mondayOffset);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: formatDateOnly(start),
    end: formatDateOnly(end),
  };
}

function getMonthRange(dateValue: string) {
  const date = parseDateOnly(dateValue);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    start: formatDateOnly(start),
    end: formatDateOnly(end),
  };
}

function getRangeLabel(params: {
  selectedDate: string;
  viewMode: OperationsViewMode;
}) {
  if (params.viewMode === "week") {
    const range = getWeekRange(params.selectedDate);
    return `Semana del ${range.start} al ${range.end}`;
  }

  if (params.viewMode === "month") {
    const date = parseDateOnly(params.selectedDate);
    return date.toLocaleDateString("es-CR", {
      month: "long",
      year: "numeric",
    });
  }

  return params.selectedDate;
}

function getEventsForRange(params: {
  events: CalendarEvent[];
  selectedDate: string;
  viewMode: OperationsViewMode;
}) {
  if (params.viewMode === "day") {
    return params.events.filter((event) => event.date === params.selectedDate);
  }

  const range =
    params.viewMode === "week"
      ? getWeekRange(params.selectedDate)
      : getMonthRange(params.selectedDate);

  return params.events.filter((event) => {
    return event.date >= range.start && event.date <= range.end;
  });
}

function buildRangeGroups(events: CalendarEvent[]) {
  const groups = new Map<string, RangeGroup>();

  events.forEach((event) => {
    const zoneKey = event.operational_zone_id || "NO_ZONE";
    const zoneName = event.operational_zone_name || "Sin agrupación asignada";
    const referenceAddress = event.operational_zone_reference_address || null;

    if (!groups.has(zoneKey)) {
      groups.set(zoneKey, {
        zoneKey,
        zoneName,
        referenceAddress,
        dates: new Map(),
        total_jobs: 0,
        total_installations: 0,
        total_maintenances: 0,
        route_stops: [],
      });
    }

    const group = groups.get(zoneKey);
    if (!group) return;

    if (!group.dates.has(event.date)) {
      group.dates.set(event.date, {
        events: [],
        total_installations: 0,
        total_maintenances: 0,
        route_stops: [],
      });
    }

    const dateGroup = group.dates.get(event.date);
    if (!dateGroup) return;

    group.total_jobs += 1;
    dateGroup.events.push(event);

    if (event.entity_type === "installation") {
      group.total_installations += 1;
      dateGroup.total_installations += 1;
    }

    if (event.entity_type === "follow_up") {
      group.total_maintenances += 1;
      dateGroup.total_maintenances += 1;
    }

    if (event.route_address) {
      group.route_stops.push(event.route_address);
      dateGroup.route_stops.push(event.route_address);
    }
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.zoneKey === "NO_ZONE") return 1;
    if (b.zoneKey === "NO_ZONE") return -1;

    return b.total_jobs - a.total_jobs;
  });
}

export function OperationsRangeGroups({
  events,
  selectedDate,
  viewMode,
  onUseGroupAsRoute,
}: OperationsRangeGroupsProps) {
  if (viewMode === "day") {
    return null;
  }

  const rangeEvents = getEventsForRange({
    events,
    selectedDate,
    viewMode,
  });

  const groups = buildRangeGroups(rangeEvents);
  const rangeLabel = getRangeLabel({ selectedDate, viewMode });

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Agrupaciones operativas por {viewMode === "week" ? "semana" : "mes"}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {rangeLabel}. Trabajos organizados según las zonas o rutas
          configuradas por el usuario.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            No hay trabajos programados para este rango.
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.zoneKey}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {group.zoneName}
                    </p>

                    {group.zoneKey === "NO_ZONE" ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Sin zona
                      </span>
                    ) : (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Ruta configurada
                      </span>
                    )}
                  </div>

                  {group.referenceAddress ? (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Referencia: {group.referenceAddress}
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

                  <div className="mt-4 space-y-2">
                    {Array.from(group.dates.entries())
                      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                      .map(([date, dateGroup]) => (
                        <div
                          key={date}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800">
                              {date}
                            </p>

                            <p className="text-xs text-slate-500">
                              {dateGroup.events.length} trabajos ·{" "}
                              {dateGroup.total_installations} instalaciones ·{" "}
                              {dateGroup.total_maintenances} mantenimientos
                            </p>
                          </div>
                        </div>
                      ))}
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
                    Usar agrupación como ruta
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
