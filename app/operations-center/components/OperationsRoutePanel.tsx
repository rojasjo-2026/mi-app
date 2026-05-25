"use client";

import { useMemo, useState } from "react";

import { buildGoogleMapsUrl } from "../utils";

type OperationsRoutePanelProps = {
  routeStopsText: string;
  onRouteStopsTextChange: (value: string) => void;
};

export function OperationsRoutePanel({
  routeStopsText,
  onRouteStopsTextChange,
}: OperationsRoutePanelProps) {
  const [origin, setOrigin] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [routeError, setRouteError] = useState("");

  const routeStops = useMemo(() => {
    return routeStopsText
      .split("\n")
      .map((stop) => stop.trim())
      .filter((stop) => stop.length > 0);
  }, [routeStopsText]);

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

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Ruta en Google Maps</h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        CLARIUS prepara las paradas con los datos del sistema. Google Maps se
        encarga de navegación, tráfico y tiempos reales.
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
            Paradas de la ruta
          </span>

          <textarea
            rows={7}
            value={routeStopsText}
            onChange={(event) => onRouteStopsTextChange(event.target.value)}
            placeholder={`Seleccione una agrupación operativa o ingrese una parada por línea.\nEj.\nCliente 1, San José\nCliente 2, Heredia\nCliente 3, Alajuela`}
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
          Las paradas pueden venir desde una agrupación operativa configurada o
          pueden ajustarse manualmente antes de abrir Google Maps.
        </p>
      </div>
    </div>
  );
}
