import {
  DEFAULT_COUNTRY_CODE,
  normalizeCountryCode as normalizeConfiguredCountryCode,
} from "@/lib/config/app-settings";
import type {
  OperationalZoneCreateData,
  OperationalZoneFilters,
  OperationalZoneUpdateData,
} from "@/lib/operational-zones/operationalZones.repository";

export class OperationalZonesValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "OperationalZonesValidationError";
    this.status = status;
  }
}

function normalizeRequiredText(value: unknown, fieldName: string) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    throw new OperationalZonesValidationError(`${fieldName} es requerido.`);
  }

  return cleanValue;
}

function normalizeOptionalText(value: unknown) {
  const cleanValue = String(value || "").trim();

  return cleanValue || null;
}

function normalizeCountryCode(value: unknown) {
  const cleanValue = String(value || "").trim();

  return normalizeConfiguredCountryCode(cleanValue, DEFAULT_COUNTRY_CODE);
}

function normalizeOptionalDecimal(value: unknown, fieldName: string) {
  if (value === undefined) return undefined;

  const cleanValue = String(value || "").trim();

  if (!cleanValue) return null;

  const parsedValue = Number(cleanValue);

  if (!Number.isFinite(parsedValue)) {
    throw new OperationalZonesValidationError(`${fieldName} no es válido.`);
  }

  return cleanValue;
}

function normalizeOptionalInteger(value: unknown, fieldName: string) {
  if (value === undefined) return undefined;

  const cleanValue = String(value || "").trim();

  if (!cleanValue) return null;

  const parsedValue = Number(cleanValue);

  if (!Number.isFinite(parsedValue) || !Number.isInteger(parsedValue)) {
    throw new OperationalZonesValidationError(`${fieldName} no es válido.`);
  }

  return parsedValue;
}

function normalizeOptionalBoolean(value: unknown) {
  if (value === undefined) return undefined;

  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  throw new OperationalZonesValidationError("El estado activo no es válido.");
}

function validateRadius(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return value;

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new OperationalZonesValidationError("El radio de zona no es válido.");
  }

  if (parsedValue < 0) {
    throw new OperationalZonesValidationError(
      "El radio de zona no puede ser negativo.",
    );
  }

  return value;
}

function validateCoordinates(params: {
  latitude?: string | number | null;
  longitude?: string | number | null;
}) {
  const hasLatitude = params.latitude !== null && params.latitude !== undefined;
  const hasLongitude =
    params.longitude !== null && params.longitude !== undefined;

  if (hasLatitude !== hasLongitude) {
    throw new OperationalZonesValidationError(
      "Debe ingresar latitud y longitud juntas.",
    );
  }

  if (hasLatitude && hasLongitude) {
    const latitude = Number(params.latitude);
    const longitude = Number(params.longitude);

    if (latitude < -90 || latitude > 90) {
      throw new OperationalZonesValidationError(
        "La latitud debe estar entre -90 y 90.",
      );
    }

    if (longitude < -180 || longitude > 180) {
      throw new OperationalZonesValidationError(
        "La longitud debe estar entre -180 y 180.",
      );
    }
  }
}

export function normalizeOperationalZoneCreateInput(
  input: Record<string, unknown>,
): OperationalZoneCreateData {
  const latitude = normalizeOptionalDecimal(input.latitude, "La latitud");
  const longitude = normalizeOptionalDecimal(input.longitude, "La longitud");
  const radiusKm = validateRadius(
    normalizeOptionalDecimal(input.radius_km, "El radio de zona"),
  );

  validateCoordinates({
    latitude,
    longitude,
  });

  return {
    country_code: normalizeCountryCode(input.country_code),
    name: normalizeRequiredText(input.name, "El nombre de la zona"),
    description: normalizeOptionalText(input.description),
    reference_address: normalizeOptionalText(input.reference_address),
    latitude,
    longitude,
    radius_km: radiusKm,
    color_label: normalizeOptionalText(input.color_label),
    sort_order: normalizeOptionalInteger(input.sort_order, "El orden") ?? null,
  };
}

export function normalizeOperationalZoneUpdateInput(
  input: Record<string, unknown>,
): {
  operational_zone_id: string;
  data: OperationalZoneUpdateData;
} {
  const operationalZoneId = normalizeRequiredText(
    input.operational_zone_id || input.id,
    "El id de la zona operativa",
  );

  const data: OperationalZoneUpdateData = {};

  if (input.country_code !== undefined) {
    data.country_code = normalizeCountryCode(input.country_code);
  }

  if (input.name !== undefined) {
    data.name = normalizeRequiredText(input.name, "El nombre de la zona");
  }

  if (input.description !== undefined) {
    data.description = normalizeOptionalText(input.description);
  }

  if (input.reference_address !== undefined) {
    data.reference_address = normalizeOptionalText(input.reference_address);
  }

  if (input.latitude !== undefined) {
    data.latitude = normalizeOptionalDecimal(input.latitude, "La latitud");
  }

  if (input.longitude !== undefined) {
    data.longitude = normalizeOptionalDecimal(input.longitude, "La longitud");
  }

  if (input.radius_km !== undefined) {
    data.radius_km = validateRadius(
      normalizeOptionalDecimal(input.radius_km, "El radio de zona"),
    );
  }

  if (input.color_label !== undefined) {
    data.color_label = normalizeOptionalText(input.color_label);
  }

  if (input.sort_order !== undefined) {
    data.sort_order = normalizeOptionalInteger(input.sort_order, "El orden");
  }

  if (input.is_active !== undefined) {
    data.is_active = normalizeOptionalBoolean(input.is_active);
  }

  validateCoordinates({
    latitude: data.latitude,
    longitude: data.longitude,
  });

  return {
    operational_zone_id: operationalZoneId,
    data,
  };
}

export function normalizeOperationalZoneId(value: unknown) {
  return normalizeRequiredText(value, "El id de la zona operativa");
}

export function normalizeOperationalZoneFilters(
  searchParams: URLSearchParams,
): OperationalZoneFilters {
  const countryCode = searchParams.get("country_code");
  const activeOnly = searchParams.get("active_only");
  const search = searchParams.get("search");

  return {
    ...(countryCode ? { country_code: normalizeCountryCode(countryCode) } : {}),
    ...(activeOnly === "true" ? { active_only: true } : {}),
    ...(search ? { search: search.trim() } : {}),
  };
}
