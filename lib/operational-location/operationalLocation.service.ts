import {
  buildGoogleMapsRouteLink,
  buildGoogleMapsSearchLink,
  getOperationalCoordinates,
  getOperationalLocationContext,
  type OperationalLocationClientSource,
  type OperationalLocationContext,
  type OperationalLocationInstallationSource,
  type OperationalRouteStop,
} from "@/lib/operational-location/operationalLocation.utils";

export type OperationalWorkType = "INSTALLATION" | "MAINTENANCE" | "UNKNOWN";

export type OperationalLocationEvaluation = {
  work_type: OperationalWorkType;
  label: string;
  source: OperationalLocationContext["source"];
  has_gps_coordinates: boolean;
  latitude: number | null;
  longitude: number | null;
  can_use_for_route: boolean;
  can_calculate_distance: boolean;
  can_suggest_zone_from_gps: boolean;
  requires_manual_location_review: boolean;
  google_maps_search_url: string | null;
};

export type OperationalLocationInput = {
  work_type?: OperationalWorkType;
  installation?: OperationalLocationInstallationSource | null;
  client?: OperationalLocationClientSource | null;
};

export function evaluateOperationalLocation({
  work_type = "UNKNOWN",
  installation,
  client,
}: OperationalLocationInput): OperationalLocationEvaluation {
  const locationContext = getOperationalLocationContext({
    installation,
    client,
  });

  const routeStop: OperationalRouteStop = {
    latitude: locationContext.latitude,
    longitude: locationContext.longitude,
  };

  const googleMapsSearchUrl = buildGoogleMapsSearchLink(routeStop);

  return {
    work_type,
    label: locationContext.label,
    source: locationContext.source,
    has_gps_coordinates: locationContext.has_gps_coordinates,
    latitude: locationContext.latitude,
    longitude: locationContext.longitude,
    can_use_for_route: locationContext.has_gps_coordinates,
    can_calculate_distance: locationContext.has_gps_coordinates,
    can_suggest_zone_from_gps: locationContext.can_suggest_zone_from_gps,
    requires_manual_location_review: locationContext.source === "UNDEFINED",
    google_maps_search_url: googleMapsSearchUrl,
  };
}

export function getOperationalGroupingLabel(input: OperationalLocationInput) {
  return evaluateOperationalLocation(input).label;
}

export function getOperationalRouteStop(
  input: OperationalLocationInput,
): OperationalRouteStop | null {
  const coordinates = getOperationalCoordinates({
    installation: input.installation,
    client: input.client,
  });

  if (coordinates.latitude === null || coordinates.longitude === null) {
    return null;
  }

  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

export function canUseOperationalLocationForRoute(
  input: OperationalLocationInput,
) {
  return getOperationalRouteStop(input) !== null;
}

export function canSuggestZoneFromGps(input: OperationalLocationInput) {
  return evaluateOperationalLocation(input).can_suggest_zone_from_gps;
}

export function requiresManualLocationReview(input: OperationalLocationInput) {
  return evaluateOperationalLocation(input).requires_manual_location_review;
}

export function buildOperationalRouteLink<TItem>(
  items: TItem[],
  getLocationInput: (item: TItem) => OperationalLocationInput,
) {
  const routeStops = items
    .map((item) => getOperationalRouteStop(getLocationInput(item)))
    .filter((stop): stop is OperationalRouteStop => stop !== null);

  return buildGoogleMapsRouteLink(routeStops);
}

export function summarizeOperationalLocation(input: OperationalLocationInput) {
  const evaluation = evaluateOperationalLocation(input);

  if (evaluation.source === "USER_ZONE") {
    return {
      title: evaluation.label,
      message:
        "Ubicación clasificada por una zona definida por el usuario. El GPS puede usarse como apoyo para rutas y sugerencias.",
      evaluation,
    };
  }

  if (evaluation.source === "INSTALLATION_ADDRESS") {
    return {
      title: evaluation.label,
      message:
        "Ubicación tomada desde la instalación. Puede usarse como respaldo cuando no hay una zona definida por el usuario.",
      evaluation,
    };
  }

  if (evaluation.source === "CLIENT_LOCATION") {
    return {
      title: evaluation.label,
      message:
        "Ubicación tomada desde el cliente. Puede usarse como respaldo cuando el mantenimiento no tiene instalación o zona definida.",
      evaluation,
    };
  }

  if (evaluation.source === "GPS_ONLY") {
    return {
      title: evaluation.label,
      message:
        "La ubicación tiene GPS, pero no tiene una zona operativa definida por el usuario. CLARIUS puede sugerir una zona, pero no debe asignarla automáticamente.",
      evaluation,
    };
  }

  return {
    title: evaluation.label,
    message:
      "No hay suficiente información de ubicación. Se recomienda revisar dirección, zona o coordenadas.",
    evaluation,
  };
}
