"use client";

import { useMemo, useState } from "react";

import OperationalZonePlaceAutocomplete from "@/app/settings/components/OperationalZonePlaceAutocomplete";
import { resolveAppSettings } from "@/lib/config/app-settings";

import {
  buildGoogleMapsUrl,
  formatRouteCoordinate,
  normalizeRouteStops,
  parseRouteCoordinate,
  sortRouteStopsByNearestOrigin,
  type RouteCoordinate,
} from "../utils";

type OperationsRoutePanelProps = {
  routeStopsText: string;
  onRouteStopsTextChange: (value: string) => void;
  countryCode?: string;
};

function getStopsLabel(totalStops: number) {
  return totalStops === 1 ? "1 parada" : `${totalStops} paradas`;
}

export function OperationsRoutePanel({
  routeStopsText,
  onRouteStopsTextChange,
  countryCode,
}: OperationsRoutePanelProps) {
  const defaultSettings = useMemo(() => resolveAppSettings(), []);
  const activeCountryCode = (
    countryCode?.trim() || defaultSettings.countryCode
  ).toUpperCase();

  const [origin, setOrigin] = useState("");
  const [originCoordinate, setOriginCoordinate] =
    useState<RouteCoordinate | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [routeError, setRouteError] = useState("");

  const rawRouteStops = useMemo(() => {
    return routeStopsText
      .split("\n")
      .map((stop) => stop.trim())
      .filter((stop) => stop.length > 0);
  }, [routeStopsText]);

  const normalizedRouteStops = useMemo(() => {
    return normalizeRouteStops(rawRouteStops);
  }, [rawRouteStops]);

  const routePlan = useMemo(() => {
    return sortRouteStopsByNearestOrigin({
      origin: originCoordinate,
      stops: normalizedRouteStops,
    });
  }, [originCoordinate, normalizedRouteStops]);

  const routeStops = routePlan.stops;
  const duplicatedStopsCount =
    rawRouteStops.length - normalizedRouteStops.length;
  const hasRouteStops = routeStops.length > 0;

  const allStopsHaveCoordinates =
    normalizedRouteStops.length > 0 &&
    normalizedRouteStops.every((stop) => parseRouteCoordinate(stop));

  function handleOriginValueChange(value: string) {
    setOrigin(value);
    setOriginCoordinate(null);
    setRouteError("");
  }

  function handleOriginPlaceSelected(place: {
    reference_address: string;
    latitude: string;
    longitude: string;
  }) {
    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);

    setOrigin(place.reference_address);
    setRouteError("");

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      setOriginCoordinate({
        latitude,
        longitude,
      });
    } else {
      setOriginCoordinate(null);
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
        const coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setOrigin(formatRouteCoordinate(coordinate));
        setOriginCoordinate(coordinate);
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

    const originForRoute = originCoordinate
      ? formatRouteCoordinate(originCoordinate)
      : origin;

    const googleMapsUrl = buildGoogleMapsUrl({
      origin: originForRoute,
      stops: routeStops,
    });

    if (!googleMapsUrl) {
      setRouteError(
        "Ingrese un punto de salida y al menos una parada válida para abrir la ruta.",
      );
      return;
    }

    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  }

  function handleClearStops() {
    setRouteError("");
    onRouteStopsTextChange("");
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">
            Ruta en Google Maps
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            CLARIUS prepara las paradas con los datos del sistema. Google Maps
            se encarga de navegación, tráfico y tiempos reales.
          </p>
        </div>

        <span className="inline-flex h-7 shrink-0 items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-600">
          {getStopsLabel(routeStops.length)}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Punto de salida
          </span>

          <OperationalZonePlaceAutocomplete
            value={origin}
            countryCode={activeCountryCode}
            placeholder="Busque un punto de salida. Ej. oficina central o punto de referencia"
            onValueChange={handleOriginValueChange}
            onPlaceSelected={handleOriginPlaceSelected}
          />
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={loadingLocation}
          className="inline-flex h-9 w-full items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingLocation
            ? "Obteniendo ubicación..."
            : "Usar mi ubicación actual"}
        </button>

        {originCoordinate &&
        allStopsHaveCoordinates &&
        routeStops.length > 1 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700">
            Las paradas fueron ordenadas automáticamente por cercanía desde el
            punto de salida.
          </div>
        ) : null}

        {!originCoordinate &&
        allStopsHaveCoordinates &&
        routeStops.length > 1 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
            Para ordenar automáticamente las paradas por cercanía, use la
            ubicación actual o seleccione una dirección desde las sugerencias.
          </div>
        ) : null}

        {hasRouteStops ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Paradas cargadas
                </p>

                {duplicatedStopsCount > 0 ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Se omitieron {duplicatedStopsCount} paradas duplicadas.
                  </p>
                ) : null}

                {routePlan.sorted ? (
                  <p className="mt-1 text-xs text-emerald-700">
                    Ordenadas por cercanía al punto de salida.
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleClearStops}
                className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
              >
                Limpiar
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {routeStops.map((stop, index) => (
                <div
                  key={`${stop}-${index}`}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <p className="text-xs font-semibold text-slate-500">
                    Parada {index + 1}
                  </p>

                  <p className="mt-1 break-words text-sm font-medium text-slate-800">
                    {stop}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Paradas de la ruta
          </span>

          <textarea
            rows={7}
            value={routeStopsText}
            onChange={(event) => onRouteStopsTextChange(event.target.value)}
            placeholder={`Seleccione una agrupación operativa o ingrese una parada por línea.\nEj.\nCliente 1, dirección o coordenadas\nCliente 2, dirección o coordenadas\nCliente 3, dirección o coordenadas`}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </label>

        {routeError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {routeError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleOpenGoogleMapsRoute}
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
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
