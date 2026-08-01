import type {
  InventoryLocation,
  InventoryLocationFormErrors,
  InventoryLocationFormState,
} from "../types";

const LOCATION_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatMetadata(metadata: unknown) {
  if (!isJsonObject(metadata) || Object.keys(metadata).length === 0) {
    return "";
  }

  return JSON.stringify(metadata, null, 2);
}

export function createEmptyInventoryLocationFormState(
  countryCode = "",
): InventoryLocationFormState {
  return {
    locationCode: "",
    name: "",
    description: "",
    locationType: "WAREHOUSE",
    parentLocationId: "",
    countryCode: countryCode.trim().toUpperCase(),
    addressLine: "",
    referencePoint: "",
    latitude: "",
    longitude: "",
    allowsStock: true,
    isDefault: false,
    sortOrder: "0",
    metadataText: "",
  };
}

export function createInventoryLocationEditFormState(
  location: InventoryLocation,
): InventoryLocationFormState {
  return {
    locationCode: location.location_code,
    name: location.name,
    description: location.description || "",
    locationType: location.location_type,
    parentLocationId: location.parent_location_id || "",
    countryCode: location.country_code || "",
    addressLine: location.address_line || "",
    referencePoint: location.reference_point || "",
    latitude: location.latitude || "",
    longitude: location.longitude || "",
    allowsStock: location.allows_stock,
    isDefault: location.is_default,
    sortOrder: String(location.sort_order),
    metadataText: formatMetadata(location.metadata),
  };
}

export function validateInventoryLocationForm(
  state: InventoryLocationFormState,
): InventoryLocationFormErrors {
  const errors: InventoryLocationFormErrors = {};

  const locationCode = state.locationCode.trim().toUpperCase();

  if (!locationCode) {
    errors.locationCode = "El código es requerido.";
  } else if (locationCode.length > 40) {
    errors.locationCode = "El código no puede superar 40 caracteres.";
  } else if (!LOCATION_CODE_PATTERN.test(locationCode)) {
    errors.locationCode = "Usá letras, números, guiones o guiones bajos.";
  }

  const name = state.name.trim();

  if (!name) {
    errors.name = "El nombre es requerido.";
  } else if (name.length > 120) {
    errors.name = "El nombre no puede superar 120 caracteres.";
  }

  if (state.description.trim().length > 500) {
    errors.description = "La descripción no puede superar 500 caracteres.";
  }

  const countryCode = state.countryCode.trim().toUpperCase();

  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    errors.countryCode = "El país debe tener dos letras.";
  }

  if (state.addressLine.trim().length > 300) {
    errors.addressLine = "La dirección no puede superar 300 caracteres.";
  }

  if (state.referencePoint.trim().length > 300) {
    errors.referencePoint = "La referencia no puede superar 300 caracteres.";
  }

  const latitude = state.latitude.trim();
  const longitude = state.longitude.trim();

  if (Boolean(latitude) !== Boolean(longitude)) {
    const message = "Ingresá latitud y longitud juntas.";

    errors.latitude = message;
    errors.longitude = message;
  }

  if (latitude) {
    const value = Number(latitude);

    if (!Number.isFinite(value) || value < -90 || value > 90) {
      errors.latitude = "La latitud debe estar entre -90 y 90.";
    }
  }

  if (longitude) {
    const value = Number(longitude);

    if (!Number.isFinite(value) || value < -180 || value > 180) {
      errors.longitude = "La longitud debe estar entre -180 y 180.";
    }
  }

  const sortOrder = state.sortOrder.trim() || "0";
  const parsedSortOrder = Number(sortOrder);

  if (
    !Number.isInteger(parsedSortOrder) ||
    parsedSortOrder < 0 ||
    parsedSortOrder > 1_000_000
  ) {
    errors.sortOrder = "El orden debe ser un entero entre 0 y 1000000.";
  }

  const metadataText = state.metadataText.trim();

  if (metadataText) {
    try {
      const metadata: unknown = JSON.parse(metadataText);

      if (!isJsonObject(metadata)) {
        errors.metadataText = "Los metadatos deben ser un objeto JSON.";
      }
    } catch {
      errors.metadataText = "Los metadatos no contienen un JSON válido.";
    }
  }

  return errors;
}

export function buildInventoryLocationPayload(
  state: InventoryLocationFormState,
): Record<string, unknown> {
  const metadataText = state.metadataText.trim();

  return {
    parent_location_id: state.parentLocationId || null,
    location_code: state.locationCode.trim().toUpperCase(),
    name: state.name.trim(),
    description: state.description.trim() || null,
    location_type: state.locationType,
    country_code: state.countryCode.trim().toUpperCase() || null,
    address_line: state.addressLine.trim() || null,
    reference_point: state.referencePoint.trim() || null,
    latitude: state.latitude.trim() || null,
    longitude: state.longitude.trim() || null,
    allows_stock: state.allowsStock,
    is_default: state.isDefault,
    sort_order: Number(state.sortOrder.trim() || "0"),
    metadata: metadataText ? JSON.parse(metadataText) : {},
  };
}

export function getFirstInventoryLocationFormError(
  errors: InventoryLocationFormErrors,
) {
  return Object.values(errors).find(Boolean);
}
