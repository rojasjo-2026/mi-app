"use client";

import { useMemo } from "react";

type Props = {
  locating: boolean;
  latitude: string;
  longitude: string;
  handleUseCurrentLocation: () => void;
  setLatitude: (value: string) => void;
  setLongitude: (value: string) => void;
};

const inputClassName =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const secondaryButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

export default function InstallationCoordinatesSection({
  locating,
  latitude,
  longitude,
  handleUseCurrentLocation,
  setLatitude,
  setLongitude,
}: Props) {
  const hasLatitudeValue = latitude.trim() !== "";
  const hasLongitudeValue = longitude.trim() !== "";

  const latValue = Number(latitude);
  const lngValue = Number(longitude);

  const hasInvalidLatitude =
    hasLatitudeValue &&
    (Number.isNaN(latValue) || latValue < -90 || latValue > 90);

  const hasInvalidLongitude =
    hasLongitudeValue &&
    (Number.isNaN(lngValue) || lngValue < -180 || lngValue > 180);

  const hasCoordinates =
    hasLatitudeValue &&
    hasLongitudeValue &&
    !hasInvalidLatitude &&
    !hasInvalidLongitude;

  const openStreetMapEmbedUrl = useMemo(() => {
    if (!hasCoordinates) return null;

    const offset = 0.0035;
    const left = lngValue - offset;
    const right = lngValue + offset;
    const top = latValue + offset;
    const bottom = latValue - offset;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latValue}%2C${lngValue}`;
  }, [hasCoordinates, latValue, lngValue]);

  const googleMapsUrl = useMemo(() => {
    if (!hasCoordinates) return null;

    return `https://www.google.com/maps?q=${latValue},${lngValue}`;
  }, [hasCoordinates, latValue, lngValue]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className={secondaryButtonClassName}
        >
          {locating ? (
            <>
              <span className="animate-pulse">📍</span>
              Obteniendo ubicación...
            </>
          ) : (
            <>📍 Usar ubicación actual</>
          )}
        </button>

        {googleMapsUrl ? (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryButtonClassName}
          >
            🗺️ Abrir en Google Maps
          </a>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Latitud
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className={inputClassName}
            placeholder="Ingrese la latitud"
          />

          {hasInvalidLatitude ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              La latitud debe estar entre -90 y 90.
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Longitud
          </label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className={inputClassName}
            placeholder="Ingrese la longitud"
          />

          {hasInvalidLongitude ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              La longitud debe estar entre -180 y 180.
            </p>
          ) : null}
        </div>
      </div>

      {openStreetMapEmbedUrl ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <iframe
            title="Mapa de ubicación"
            src={openStreetMapEmbedUrl}
            className="h-72 w-full"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm leading-6 text-slate-500">
          Ingrese coordenadas válidas o use su ubicación actual para ver una
          vista previa del mapa.
        </div>
      )}
    </div>
  );
}
