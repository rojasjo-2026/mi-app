"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarEvent = {
  id: string;
  entity_type: string;
  date: string;
  type?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  billing_status?: string;
  is_confirmed?: boolean;
  is_completed?: boolean;
};

type AvailabilityData = {
  country_code: string;
  date: string;
  can_offer_day: boolean;
  reason: string | null;
  workload: {
    total_jobs: number;
    total_installations: number;
    total_maintenances: number;
    has_installation: boolean;
  };
  capacity: {
    max_jobs_per_day: number | null;
    max_installations_per_day: number | null;
    max_maintenances_per_day: number | null;
    remaining_jobs_capacity: number | null;
    remaining_installations_capacity: number | null;
    remaining_maintenances_capacity: number | null;
  };
};

type CalendarApiResponse = {
  success: boolean;
  data?: CalendarEvent[];
  message?: string;
};

type AvailabilityApiResponse = {
  success: boolean;
  data?: AvailabilityData;
  message?: string;
};

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getEventTypeLabel(event: CalendarEvent) {
  if (event.entity_type === "installation") {
    return "Instalación";
  }

  if (event.entity_type === "follow_up") {
    return "Mantenimiento";
  }

  return "Trabajo";
}

function getEventBadgeClasses(event: CalendarEvent) {
  if (event.entity_type === "installation") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (event.entity_type === "follow_up") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function buildGoogleMapsUrl(params: { origin: string; stops: string[] }) {
  const cleanOrigin = params.origin.trim();
  const cleanStops = params.stops
    .map((stop) => stop.trim())
    .filter((stop) => stop.length > 0);

  if (!cleanOrigin || cleanStops.length === 0) {
    return "";
  }

  const destination = cleanStops[cleanStops.length - 1];
  const waypoints = cleanStops.slice(0, -1);

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", cleanOrigin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("travelmode", "driving");

  if (waypoints.length > 0) {
    url.searchParams.set("waypoints", waypoints.join("|"));
  }

  return url.toString();
}

export default function OperationsCenterPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    null,
  );

  const [origin, setOrigin] = useState("");
  const [routeStopsText, setRouteStopsText] = useState("");

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [error, setError] = useState("");
  const [routeError, setRouteError] = useState("");

  const selectedDateEvents = useMemo(() => {
    return events.filter((event) => event.date === selectedDate);
  }, [events, selectedDate]);

  const installations = useMemo(() => {
    return selectedDateEvents.filter(
      (event) => event.entity_type === "installation",
    );
  }, [selectedDateEvents]);

  const maintenances = useMemo(() => {
    return selectedDateEvents.filter(
      (event) => event.entity_type === "follow_up",
    );
  }, [selectedDateEvents]);

  const routeStops = useMemo(() => {
    return routeStopsText
      .split("\n")
      .map((stop) => stop.trim())
      .filter((stop) => stop.length > 0);
  }, [routeStopsText]);

  async function loadCalendarEvents() {
    try {
      setLoadingEvents(true);
      setError("");

      const response = await fetch("/api/calendar", {
        cache: "no-store",
      });

      const result: CalendarApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo cargar el calendario.");
      }

      setEvents(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar los trabajos.",
      );
    } finally {
      setLoadingEvents(false);
    }
  }

  async function loadAvailability(date: string) {
    try {
      setLoadingAvailability(true);
      setError("");

      const response = await fetch(
        `/api/availability/daily?country_code=CR&date=${encodeURIComponent(
          date,
        )}`,
        {
          cache: "no-store",
        },
      );

      const result: AvailabilityApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo cargar la disponibilidad.",
        );
      }

      setAvailability(result.data ?? null);
    } catch (err) {
      setAvailability(null);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar la disponibilidad.",
      );
    } finally {
      setLoadingAvailability(false);
    }
  }

  function handleUseCurrentLocation() {
    setRouteError("");

    if (!navigator.geolocation) {
      setRouteError("El navegador no permite obtener la ubicación actual.");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setOrigin(`${latitude},${longitude}`);
        setLoadingLocation(false);
      },
      () => {
        setRouteError(
          "No se pudo obtener la ubicación actual. Puede ingresar una dirección manual.",
        );
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  function handleOpenGoogleMapsRoute() {
    setRouteError("");

    const googleMapsUrl = buildGoogleMapsUrl({
      origin,
      stops: routeStops,
    });

    if (!googleMapsUrl) {
      setRouteError(
        "Ingrese un punto de salida y al menos una dirección de destino.",
      );
      return;
    }

    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    void loadCalendarEvents();
  }, []);

  useEffect(() => {
    void loadAvailability(selectedDate);
  }, [selectedDate]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                CLARIUS
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Centro operativo
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Planifique los trabajos por fecha, revise la capacidad del día,
                agrupe visitas y prepare una ruta para abrirla en Google Maps.
              </p>
            </div>

            <label className="w-full max-w-xs space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Fecha operativa
              </span>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </label>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Trabajos del día
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loadingEvents ? "..." : selectedDateEvents.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Instalaciones y mantenimientos programados.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Instalaciones
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {loadingEvents ? "..." : installations.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Trabajos de mayor carga operativa.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Mantenimientos
            </p>

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
              {loadingAvailability
                ? "..."
                : availability?.capacity.max_jobs_per_day
                  ? `${availability.workload.total_jobs}/${availability.capacity.max_jobs_per_day}`
                  : "Sin límite"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {availability?.can_offer_day
                ? "Día disponible según reglas."
                : availability?.reason || "Sin evaluación disponible."}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
                onClick={() => void loadCalendarEvents()}
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

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Ruta en Google Maps
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                CLARIUS prepara la ruta. Google Maps se encarga de navegación,
                tráfico y tiempos reales.
              </p>

              <div className="mt-5 space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Punto de salida
                  </span>

                  <input
                    value={origin}
                    onChange={(event) => setOrigin(event.target.value)}
                    placeholder="Ej. San José, Costa Rica o ubicación actual"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={loadingLocation}
                  className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingLocation
                    ? "Obteniendo ubicación..."
                    : "Usar mi ubicación actual"}
                </button>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Direcciones de la ruta
                  </span>

                  <textarea
                    rows={7}
                    value={routeStopsText}
                    onChange={(event) => setRouteStopsText(event.target.value)}
                    placeholder={`Ingrese una dirección por línea.\nEj.\nCliente 1, San José\nCliente 2, Heredia\nCliente 3, Alajuela`}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>

                {routeError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {routeError}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleOpenGoogleMapsRoute}
                  className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
                >
                  Abrir ruta en Google Maps
                </button>

                <p className="text-xs leading-5 text-slate-400">
                  En esta primera versión las direcciones se ingresan
                  manualmente. Luego se puede conectar con la dirección real del
                  cliente o la instalación para generar la ruta automáticamente.
                </p>
              </div>
            </div>

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
          </div>
        </section>
      </div>
    </main>
  );
}
