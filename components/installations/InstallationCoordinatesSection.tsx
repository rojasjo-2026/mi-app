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
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

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
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            Coordenadas GPS
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Captura automáticamente la ubicación o ingresa las coordenadas
            manualmente.
          </p>
        </div>

        <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
          GPS
        </span>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {locating ? (
            <>
              <span className="animate-pulse">📍</span>
              Obteniendo ubicación...
            </>
          ) : (
            <>📍 Usar mi ubicación actual</>
          )}
        </button>

        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            🗺️ Abrir en Google Maps
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
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

          {hasInvalidLatitude && (
            <p className="mt-1 text-xs font-medium text-red-600">
              La latitud debe estar entre -90 y 90.
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
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

          {hasInvalidLongitude && (
            <p className="mt-1 text-xs font-medium text-red-600">
              La longitud debe estar entre -180 y 180.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        {openStreetMapEmbedUrl ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <iframe
              title="Mapa de ubicación"
              src={openStreetMapEmbedUrl}
              className="h-72 w-full"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-sm text-slate-500">
            Ingrese coordenadas válidas o use su ubicación actual para ver una
            vista previa del mapa.
          </div>
        )}
      </div>
    </div>
  );
}
