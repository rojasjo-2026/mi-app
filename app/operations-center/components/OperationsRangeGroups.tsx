import { resolveAppSettings } from "@/lib/config/app-settings";

import type {
  AvailabilityByDateMap,
  CalendarEvent,
  OperationsViewMode,
} from "../types";

type OperationsRangeGroupsProps = {
  events: CalendarEvent[];
  selectedDate: string;
  viewMode: OperationsViewMode;
  availabilityByDate: AvailabilityByDateMap;
  loadingAvailability: boolean;
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

function formatOperationalDate(dateValue: string, locale?: string) {
  const date = parseDateOnly(dateValue);

  const formatted = date.toLocaleDateString(
    locale || resolveAppSettings().locale,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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
  locale?: string;
}) {
  if (params.viewMode === "week") {
    const range = getWeekRange(params.selectedDate);
    return `Semana del ${range.start} al ${range.end}`;
  }

  if (params.viewMode === "month") {
    const date = parseDateOnly(params.selectedDate);
    return date.toLocaleDateString(
      params.locale || resolveAppSettings().locale,
      {
        month: "long",
        year: "numeric",
      },
    );
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

function getCapacityLabel(params: {
  date: string;
  availabilityByDate: AvailabilityByDateMap;
  loadingAvailability: boolean;
}) {
  if (params.loadingAvailability) {
    return "Cargando capacidad...";
  }

  const availability = params.availabilityByDate[params.date];

  if (!availability) {
    return "Capacidad no calculada";
  }

  const maxJobs = availability.capacity.max_jobs_per_day;

  if (typeof maxJobs !== "number") {
    return `${availability.workload.total_jobs} trabajos · Sin límite`;
  }

  return `${availability.workload.total_jobs}/${maxJobs} trabajos`;
}

function getAvailabilityStatusLabel(params: {
  date: string;
  availabilityByDate: AvailabilityByDateMap;
  loadingAvailability: boolean;
}) {
  if (params.loadingAvailability) {
    return "Evaluando...";
  }

  const availability = params.availabilityByDate[params.date];

  if (!availability) {
    return "Sin evaluación";
  }

  return availability.can_offer_day ? "Disponible" : "No disponible";
}

function getAvailabilityStatusClasses(params: {
  date: string;
  availabilityByDate: AvailabilityByDateMap;
  loadingAvailability: boolean;
}) {
  if (params.loadingAvailability) {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  const availability = params.availabilityByDate[params.date];

  if (!availability) {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }

  return availability.can_offer_day
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
}

export function OperationsRangeGroups({
  events,
  selectedDate,
  viewMode,
  availabilityByDate,
  loadingAvailability,
  onUseGroupAsRoute,
}: OperationsRangeGroupsProps) {
  if (viewMode === "day") {
    return null;
  }

  const locale = resolveAppSettings().locale;

  const rangeEvents = getEventsForRange({
    events,
    selectedDate,
    viewMode,
  });

  const groups = buildRangeGroups(rangeEvents);
  const rangeLabel = getRangeLabel({ selectedDate, viewMode, locale });
  const rangeTypeLabel = viewMode === "week" ? "semana" : "mes";

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="text-base font-semibold text-slate-950">
          Agrupaciones operativas por {rangeTypeLabel}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {rangeLabel}. Trabajos organizados según las zonas o rutas
          configuradas por el usuario.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="px-4 py-5">
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
            <p className="text-sm font-semibold text-slate-700">
              No hay trabajos programados para este {rangeTypeLabel}.
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Revise otro rango o confirme si existen instalaciones y
              mantenimientos programados en el calendario.
            </p>

            <p className="mt-3 text-xs leading-5 text-slate-400">
              Cuando existan trabajos, CLARIUS los agrupará por fecha y zona
              operativa para preparar rutas por día.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4">
          {groups.map((group, index) => (
            <section
              key={group.zoneKey}
              className={index > 0 ? "mt-5 border-t border-slate-200 pt-5" : ""}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {group.zoneName}
                    </h3>

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
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 font-semibold text-slate-700">
                    {group.total_jobs} trabajos
                  </span>

                  <span className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 font-semibold text-slate-700">
                    {group.total_installations} instalaciones
                  </span>

                  <span className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 font-semibold text-slate-700">
                    {group.total_maintenances} mantenimientos
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="hidden xl:grid xl:grid-cols-[minmax(220px,1.25fr)_minmax(260px,1.4fr)_120px_130px_160px] xl:gap-4 xl:px-3 xl:pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Fecha
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Resumen del día
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Capacidad
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Estado
                  </span>
                  <span className="text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Acciones
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {Array.from(group.dates.entries())
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, dateGroup]) => (
                      <div
                        key={date}
                        className="grid gap-3 rounded-md bg-slate-50 px-3 py-3 xl:grid-cols-[minmax(220px,1.25fr)_minmax(260px,1.4fr)_120px_130px_160px] xl:items-center xl:gap-4"
                      >
                        <div className="min-w-0">
                          <p className="xl:hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Fecha
                          </p>
                          <p className="font-semibold text-slate-950">
                            {formatOperationalDate(date, locale)}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="xl:hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Resumen del día
                          </p>
                          <p className="text-sm text-slate-500">
                            {dateGroup.events.length}{" "}
                            {dateGroup.events.length === 1
                              ? "trabajo"
                              : "trabajos"}{" "}
                            · {dateGroup.total_installations} instalaciones ·{" "}
                            {dateGroup.total_maintenances} mantenimientos
                          </p>
                        </div>

                        <div>
                          <p className="xl:hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Capacidad
                          </p>
                          <span className="text-sm font-semibold text-slate-700">
                            {getCapacityLabel({
                              date,
                              availabilityByDate,
                              loadingAvailability,
                            })}
                          </span>
                        </div>

                        <div>
                          <p className="xl:hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Estado
                          </p>
                          <span
                            className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${getAvailabilityStatusClasses(
                              {
                                date,
                                availabilityByDate,
                                loadingAvailability,
                              },
                            )}`}
                          >
                            {getAvailabilityStatusLabel({
                              date,
                              availabilityByDate,
                              loadingAvailability,
                            })}
                          </span>
                        </div>

                        <div className="flex xl:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              onUseGroupAsRoute?.(dateGroup.route_stops)
                            }
                            disabled={
                              !onUseGroupAsRoute ||
                              dateGroup.route_stops.length === 0
                            }
                            className="inline-flex h-8 items-center justify-center rounded-md border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Usar ruta de este día
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                Paradas disponibles en el rango: {group.route_stops.length}
              </p>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
