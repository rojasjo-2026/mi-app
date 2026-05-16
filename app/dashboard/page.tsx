"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

type DashboardMetrics = {
  active_clients: number;
  pending_follow_ups: number;
  contact_attempts_today: number;
  contact_rate: number;
  installations_total: number;
  overdue_follow_ups: number;
  today_follow_ups: number;
  upcoming_follow_ups: number;
  future_installations: number;
  warranty_expiring_soon: number;
};

type FollowUpByZoneItem = {
  id: string;
  target_date: string;
  priority: number;
  status: string;
  client: {
    id: string;
    first_name: string;
    last_name_1: string;
    last_name_2: string | null;
    phone_primary: string | null;
  } | null;
  installation: {
    id: string;
    address: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
  } | null;
};

type FollowUpZoneGroup = {
  zone: string;
  total: number;
  items: FollowUpByZoneItem[];
};

type Scenario = "all" | "overdue" | "today" | "upcoming";

type MapPoint = FollowUpByZoneItem & {
  lat: number;
  lng: number;
};

function getClientFullName(client: FollowUpByZoneItem["client"]) {
  if (!client) return "";

  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

function buildWhatsAppLink(phone: string, clientName?: string | null) {
  const cleanPhone = phone.replace(/\D/g, "");

  if (!cleanPhone) {
    return null;
  }

  let formattedPhone = cleanPhone;

  if (formattedPhone.length === 8) {
    formattedPhone = `506${formattedPhone}`;
  }

  const message = clientName
    ? `Hola ${clientName}, le escribimos para coordinar su mantenimiento programado.`
    : "Hola, le escribimos para coordinar su mantenimiento programado.";

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

function parseCoordinate(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const num = typeof value === "number" ? value : Number(value);

  return Number.isFinite(num) ? num : null;
}

function getFollowUpStatus(
  targetDate: string,
): "overdue" | "today" | "upcoming" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() < today.getTime()) {
    return "overdue";
  }

  if (target.getTime() === today.getTime()) {
    return "today";
  }

  return "upcoming";
}

function getFollowUpUiState(targetDate: string) {
  const status = getFollowUpStatus(targetDate);

  if (status === "overdue") {
    return {
      bg: "bg-red-50 border-red-200",
      estadoTexto: "Vencido",
    };
  }

  if (status === "today") {
    return {
      bg: "bg-yellow-50 border-yellow-200",
      estadoTexto: "Hoy",
    };
  }

  return {
    bg: "bg-green-50 border-green-200",
    estadoTexto: "Próximo",
  };
}

function getMarkerColorByTargetDate(targetDate: string) {
  const status = getFollowUpStatus(targetDate);

  if (status === "overdue") {
    return "#dc2626";
  }

  if (status === "today") {
    return "#eab308";
  }

  return "#16a34a";
}

function getValidMapPoints(items: FollowUpZoneGroup[]): MapPoint[] {
  return items
    .flatMap((group) => group.items)
    .filter(
      (item) =>
        parseCoordinate(item.installation?.latitude) !== null &&
        parseCoordinate(item.installation?.longitude) !== null,
    )
    .map((item) => ({
      ...item,
      lat: parseCoordinate(item.installation?.latitude)!,
      lng: parseCoordinate(item.installation?.longitude)!,
    }));
}

function buildGoogleMapsRouteLink(items: FollowUpByZoneItem[]) {
  const validStops = items
    .map((item) => {
      const lat = parseCoordinate(item.installation?.latitude);
      const lng = parseCoordinate(item.installation?.longitude);

      if (lat === null || lng === null) {
        return null;
      }

      return `${lat},${lng}`;
    })
    .filter((value): value is string => Boolean(value));

  if (validStops.length === 0) {
    return null;
  }

  if (validStops.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(validStops[0])}`;
  }

  const origin = validStops[0];
  const destination = validStops[validStops.length - 1];
  const waypoints = validStops.slice(1, -1);

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);

  if (waypoints.length > 0) {
    url.searchParams.set("waypoints", waypoints.join("|"));
  }

  return url.toString();
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [scenario, setScenario] = useState<Scenario>("all");
  const [followUpsByZone, setFollowUpsByZone] = useState<FollowUpZoneGroup[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [zoneLoading, setZoneLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const metricsRes = await fetch("/api/dashboard/metrics", {
          cache: "no-store",
        });

        const metricsResult = await metricsRes.json();

        if (!metricsRes.ok || !metricsResult.success) {
          throw new Error(
            metricsResult.message || "No se pudieron cargar las métricas",
          );
        }

        setMetrics(metricsResult.data);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  useEffect(() => {
    async function loadFollowUpsByZone() {
      try {
        setZoneLoading(true);

        const res = await fetch(
          `/api/dashboard/follow-ups-by-zone?filter=${scenario}`,
          {
            cache: "no-store",
          },
        );

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(
            result.message ||
              "No se pudieron cargar los mantenimientos por zona",
          );
        }

        setFollowUpsByZone(result.data || []);
      } catch (err) {
        console.error(err);
        setFollowUpsByZone([]);
      } finally {
        setZoneLoading(false);
      }
    }

    void loadFollowUpsByZone();
  }, [scenario]);

  if (loading) {
    return <main className="p-6">Cargando dashboard...</main>;
  }

  if (error || !metrics) {
    return <main className="p-6">{error || "Error inesperado"}</main>;
  }

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-600">Resumen general de la operación</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <MetricCard title="Clientes activos" value={metrics.active_clients} />
        <MetricCard
          title="Seguimientos pendientes"
          value={metrics.pending_follow_ups}
        />
        <MetricCard
          title="Intentos de hoy"
          value={metrics.contact_attempts_today}
        />
        <MetricCard
          title="Tasa de contacto"
          value={`${metrics.contact_rate}%`}
        />
        <MetricCard title="Instalaciones" value={metrics.installations_total} />
        <MetricCard title="Vencidos" value={metrics.overdue_follow_ups} />
        <MetricCard title="Hoy" value={metrics.today_follow_ups} />
        <MetricCard title="Próximos" value={metrics.upcoming_follow_ups} />
        <MetricCard
          title="Instalaciones futuras"
          value={metrics.future_installations}
        />
        <MetricCard
          title="Garantías por vencer"
          value={metrics.warranty_expiring_soon}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Tab
          label="Todos"
          value="all"
          scenario={scenario}
          setScenario={setScenario}
        />
        <Tab
          label="Vencidos"
          value="overdue"
          scenario={scenario}
          setScenario={setScenario}
        />
        <Tab
          label="Hoy"
          value="today"
          scenario={scenario}
          setScenario={setScenario}
        />
        <Tab
          label="Próximos"
          value="upcoming"
          scenario={scenario}
          setScenario={setScenario}
        />
      </div>

      <DashboardMap items={followUpsByZone} loading={zoneLoading} />

      <FollowUpsByZone items={followUpsByZone} loading={zoneLoading} />
    </main>
  );
}

function DashboardMap({
  items,
  loading,
}: {
  items: FollowUpZoneGroup[];
  loading: boolean;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const points = useMemo(() => getValidMapPoints(items), [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps) return;

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) return;

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!mapRef.current) return;
    if (!window.google?.maps) return;

    if (points.length === 0) {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      return;
    }

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: points[0].lat, lng: points[0].lng },
        zoom: points.length === 1 ? 15 : 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }

    const map = mapInstanceRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (!infoWindowRef.current) {
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }

    if (points.length === 1) {
      map.setCenter({ lat: points[0].lat, lng: points[0].lng });
      map.setZoom(15);
    } else {
      const bounds = new window.google.maps.LatLngBounds();
      points.forEach((point) => {
        bounds.extend({ lat: point.lat, lng: point.lng });
      });
      map.fitBounds(bounds);
    }

    points.forEach((point) => {
      const { estadoTexto } = getFollowUpUiState(point.target_date);
      const markerColor = getMarkerColorByTargetDate(point.target_date);
      const clientFullName =
        getClientFullName(point.client) || "Cliente sin nombre";

      const marker = new window.google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map,
        title: clientFullName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 10,
        },
      });

      const infoContent = `
        <div style="font-size: 13px; line-height: 1.4;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${clientFullName}
          </div>
          ${
            point.installation?.address
              ? `<div style="margin-bottom: 4px;">${point.installation.address}</div>`
              : ""
          }
          <div style="margin-bottom: 4px;">
            Fecha objetivo: ${new Date(point.target_date).toLocaleDateString("es-CR")}
          </div>
          <div style="color: #6b7280;">
            Estado: ${estadoTexto}
          </div>
        </div>
      `;

      marker.addListener("click", () => {
        infoWindowRef.current.setContent(infoContent);
        infoWindowRef.current.open({
          anchor: marker,
          map,
        });
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [loading, points]);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Mapa de mantenimientos</h2>
        <p className="text-sm text-gray-500">
          Visualización geográfica de instalaciones con coordenadas
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
          <span>Vencido</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" />
          <span>Hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-green-600" />
          <span>Próximo</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        {loading ? (
          <div className="flex h-[420px] items-center justify-center text-sm text-gray-500">
            Cargando mapa...
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-[420px] items-center justify-center text-sm text-gray-500">
            No hay coordenadas disponibles para mostrar en el mapa
          </div>
        ) : (
          <div ref={mapRef} className="h-[420px] w-full" />
        )}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="mt-2 text-3xl font-semibold">{value}</h2>
    </div>
  );
}

function Tab({
  label,
  value,
  scenario,
  setScenario,
}: {
  label: string;
  value: Scenario;
  scenario: Scenario;
  setScenario: (val: Scenario) => void;
}) {
  const activeClass =
    value === "overdue"
      ? "bg-red-600 text-white"
      : value === "today"
        ? "bg-yellow-500 text-white"
        : value === "upcoming"
          ? "bg-green-600 text-white"
          : "bg-blue-600 text-white";

  return (
    <button
      onClick={() => setScenario(value)}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        scenario === value
          ? activeClass
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function FollowUpsByZone({
  items,
  loading,
}: {
  items: FollowUpZoneGroup[];
  loading: boolean;
}) {
  const sortedGroups = items.map((group) => {
    const sortedItems = [...group.items].sort((a, b) => {
      const statusOrder: Record<"overdue" | "today" | "upcoming", number> = {
        overdue: 0,
        today: 1,
        upcoming: 2,
      };

      const statusA = getFollowUpStatus(a.target_date);
      const statusB = getFollowUpStatus(b.target_date);

      if (statusOrder[statusA] !== statusOrder[statusB]) {
        return statusOrder[statusA] - statusOrder[statusB];
      }

      const priorityA = a.priority ?? 999;
      const priorityB = b.priority ?? 999;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return (
        new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
      );
    });

    return {
      ...group,
      items: sortedItems,
    };
  });

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          Mantenimientos agrupados por zona
        </h2>
        <p className="text-sm text-gray-500">
          Vista operativa para organizar rutas y prioridades
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">
          Cargando mantenimientos por zona...
        </p>
      ) : sortedGroups.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay mantenimientos para mostrar.
        </p>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map((group) => {
            const routeLink = buildGoogleMapsRouteLink(group.items);

            return (
              <div
                key={group.zone}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    📍 {group.zone}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {group.total} mantenimiento{group.total !== 1 ? "s" : ""}
                  </p>
                </div>

                {routeLink ? (
                  <div className="mb-4">
                    <a
                      href={routeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      Abrir ruta en Google Maps
                    </a>
                  </div>
                ) : (
                  <p className="mb-4 text-xs text-amber-600">
                    Esta zona no tiene coordenadas suficientes para generar una
                    ruta.
                  </p>
                )}

                <div className="space-y-3">
                  {group.items.map((item) => {
                    const { bg, estadoTexto } = getFollowUpUiState(
                      item.target_date,
                    );

                    const clientFullName =
                      getClientFullName(item.client) || "Cliente sin nombre";

                    const whatsappLink = item.client?.phone_primary
                      ? buildWhatsAppLink(
                          item.client.phone_primary,
                          clientFullName,
                        )
                      : null;

                    const hasCoordinates =
                      parseCoordinate(item.installation?.latitude) !== null &&
                      parseCoordinate(item.installation?.longitude) !== null;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-4 ${bg}`}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-base font-semibold">
                              {clientFullName}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Fecha objetivo:{" "}
                              {new Date(item.target_date).toLocaleDateString(
                                "es-CR",
                              )}
                            </p>

                            <p className="text-xs text-gray-500">
                              Prioridad: {item.priority ?? "-"} · Estado:{" "}
                              {estadoTexto}
                            </p>

                            {item.installation?.address && (
                              <p className="mt-1 text-xs text-gray-500">
                                Dirección: {item.installation.address}
                              </p>
                            )}

                            {item.client?.phone_primary && (
                              <p className="mt-1 text-xs text-gray-500">
                                WhatsApp: {item.client.phone_primary}
                              </p>
                            )}

                            <p className="mt-1 text-xs text-gray-500">
                              Coordenadas:{" "}
                              {hasCoordinates
                                ? "Disponibles"
                                : "No disponibles"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {whatsappLink ? (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                              >
                                WhatsApp
                              </a>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="cursor-not-allowed rounded-lg bg-green-300 px-3 py-2 text-sm text-white opacity-70"
                                title="Cliente sin número de WhatsApp"
                              >
                                WhatsApp
                              </button>
                            )}

                            <Link
                              href={`/follow-ups/${item.id}`}
                              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
                            >
                              Ver mantenimiento
                            </Link>

                            {item.client?.id && (
                              <Link
                                href={`/clients/${item.client.id}`}
                                className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                              >
                                Ver cliente
                              </Link>
                            )}

                            {item.installation?.id && (
                              <Link
                                href={`/installations/${item.installation.id}`}
                                className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                              >
                                Ver instalación
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
