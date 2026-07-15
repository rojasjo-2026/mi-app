"use client";

import { useEffect, useMemo, useState } from "react";

import { resolveAppSettings } from "@/lib/config/app-settings";

type OperationalZone = {
  operational_zone_id: string;
  country_code: string;
  name: string;
  description: string | null;
  reference_address: string | null;
  latitude: string | null;
  longitude: string | null;
  radius_km: string | null;
  color_label: string | null;
  sort_order: number | null;
  is_active: boolean;
};

type OperationalZonesApiResponse = {
  success: boolean;
  data?: OperationalZone[];
  message?: string;
};

type OperationalZoneSelectProps = {
  value: string;
  countryCode: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (operationalZoneId: string) => void;
};

export default function OperationalZoneSelect({
  value,
  countryCode,
  label = "Zona operativa",
  helperText = "Seleccione una zona creada por el usuario. Si no aplica, puede dejarlo sin zona.",
  disabled = false,
  placeholder = "Sin zona operativa asignada",
  onChange,
}: OperationalZoneSelectProps) {
  const [zones, setZones] = useState<OperationalZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultCountryCode = useMemo(
    () => resolveAppSettings().countryCode,
    [],
  );

  const normalizedCountryCode = useMemo(
    () =>
      String(countryCode || defaultCountryCode)
        .trim()
        .toUpperCase(),
    [countryCode, defaultCountryCode],
  );

  async function loadZones() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/operational-zones?country_code=${encodeURIComponent(
          normalizedCountryCode,
        )}&active_only=true`,
        { cache: "no-store" },
      );

      const result: OperationalZonesApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar las zonas operativas.",
        );
      }

      setZones(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setZones([]);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar las zonas operativas.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadZones();
  }, [normalizedCountryCode]);

  return (
    <div>
      <label
        htmlFor="operational-zone-select"
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <select
        id="operational-zone-select"
        value={value}
        disabled={disabled || loading}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">
          {loading ? "Cargando zonas operativas..." : placeholder}
        </option>

        {zones.map((zone) => {
          const hasGps = Boolean(zone.latitude && zone.longitude);
          const labelParts = [
            zone.name,
            zone.color_label ? `(${zone.color_label})` : "",
            hasGps ? "GPS" : "",
          ].filter(Boolean);

          return (
            <option
              key={zone.operational_zone_id}
              value={zone.operational_zone_id}
            >
              {labelParts.join(" · ")}
            </option>
          );
        })}
      </select>

      {helperText ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">{helperText}</p>
      ) : null}

      {error ? (
        <p className="mt-1 text-xs leading-5 text-amber-600">{error}</p>
      ) : null}
    </div>
  );
}
