export type OperationalCoordinateInput =
  | string
  | number
  | { toString: () => string }
  | null
  | undefined;

export type OperationalRouteStop = {
  latitude: OperationalCoordinateInput;
  longitude: OperationalCoordinateInput;
};

export type OperationalMapPoint<TItem = unknown> = {
  item: TItem;
  lat: number;
  lng: number;
};

export type OperationalLocationInstallationSource = {
  zone?: string | null;
  city?: string | null;
  address_line?: string | null;
  latitude?: OperationalCoordinateInput;
  longitude?: OperationalCoordinateInput;
};

export type OperationalLocationClientSource = {
  zone?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  address_line?: string | null;
  latitude?: OperationalCoordinateInput;
  longitude?: OperationalCoordinateInput;
};

export type OperationalLocationContext = {
  label: string;
  has_gps_coordinates: boolean;
  latitude: number | null;
  longitude: number | null;
  source:
    | "USER_ZONE"
    | "INSTALLATION_ADDRESS"
    | "CLIENT_LOCATION"
    | "GPS_ONLY"
    | "UNDEFINED";
  can_suggest_zone_from_gps: boolean;
};

export function parseOperationalCoordinate(value: OperationalCoordinateInput) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const parsedValue =
    typeof value === "number" ? value : Number(value.toString());

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function hasValidOperationalCoordinates(stop: OperationalRouteStop) {
  return (
    parseOperationalCoordinate(stop.latitude) !== null &&
    parseOperationalCoordinate(stop.longitude) !== null
  );
}

export function getOperationalCoordinates(params: {
  installation?: OperationalLocationInstallationSource | null;
  client?: OperationalLocationClientSource | null;
}) {
  const installationLatitude = parseOperationalCoordinate(
    params.installation?.latitude,
  );
  const installationLongitude = parseOperationalCoordinate(
    params.installation?.longitude,
  );

  if (installationLatitude !== null && installationLongitude !== null) {
    return {
      latitude: installationLatitude,
      longitude: installationLongitude,
      source: "INSTALLATION" as const,
    };
  }

  const clientLatitude = parseOperationalCoordinate(params.client?.latitude);
  const clientLongitude = parseOperationalCoordinate(params.client?.longitude);

  if (clientLatitude !== null && clientLongitude !== null) {
    return {
      latitude: clientLatitude,
      longitude: clientLongitude,
      source: "CLIENT" as const,
    };
  }

  return {
    latitude: null,
    longitude: null,
    source: null,
  };
}

export function getOperationalMapPoint<TItem>(
  item: TItem,
  coordinates: OperationalRouteStop,
): OperationalMapPoint<TItem> | null {
  const lat = parseOperationalCoordinate(coordinates.latitude);
  const lng = parseOperationalCoordinate(coordinates.longitude);

  if (lat === null || lng === null) {
    return null;
  }

  return {
    item,
    lat,
    lng,
  };
}

export function getValidOperationalMapPoints<TItem>(
  items: TItem[],
  getCoordinates: (item: TItem) => OperationalRouteStop,
) {
  return items
    .map((item) => getOperationalMapPoint(item, getCoordinates(item)))
    .filter((point): point is OperationalMapPoint<TItem> => point !== null);
}

export function buildGoogleMapsSearchLink(stop: OperationalRouteStop) {
  const lat = parseOperationalCoordinate(stop.latitude);
  const lng = parseOperationalCoordinate(stop.longitude);

  if (lat === null || lng === null) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lat},${lng}`,
  )}`;
}

export function buildGoogleMapsRouteLink(stops: OperationalRouteStop[]) {
  const validStops = stops
    .map((stop) => {
      const lat = parseOperationalCoordinate(stop.latitude);
      const lng = parseOperationalCoordinate(stop.longitude);

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
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      validStops[0],
    )}`;
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

function getUserDefinedLocationLabel(params: {
  installation?: OperationalLocationInstallationSource | null;
  client?: OperationalLocationClientSource | null;
}) {
  const installationZone = params.installation?.zone?.trim() || "";
  const installationCity = params.installation?.city?.trim() || "";
  const installationAddress = params.installation?.address_line?.trim() || "";

  if (installationZone && installationCity) {
    return {
      label: `${installationZone} - ${installationCity}`,
      source: "USER_ZONE" as const,
    };
  }

  if (installationZone) {
    return {
      label: installationZone,
      source: "USER_ZONE" as const,
    };
  }

  if (installationCity) {
    return {
      label: installationCity,
      source: "INSTALLATION_ADDRESS" as const,
    };
  }

  if (installationAddress) {
    return {
      label: installationAddress,
      source: "INSTALLATION_ADDRESS" as const,
    };
  }

  const clientZone = params.client?.zone?.trim() || "";
  const clientLevel1 = params.client?.admin_level_1?.trim() || "";
  const clientLevel2 = params.client?.admin_level_2?.trim() || "";
  const clientLevel3 = params.client?.admin_level_3?.trim() || "";
  const clientAddress = params.client?.address_line?.trim() || "";

  if (clientZone && clientLevel3) {
    return {
      label: `${clientZone} - ${clientLevel3}`,
      source: "USER_ZONE" as const,
    };
  }

  if (clientZone) {
    return {
      label: clientZone,
      source: "USER_ZONE" as const,
    };
  }

  if (clientLevel3) {
    return {
      label: clientLevel3,
      source: "CLIENT_LOCATION" as const,
    };
  }

  if (clientLevel2) {
    return {
      label: clientLevel2,
      source: "CLIENT_LOCATION" as const,
    };
  }

  if (clientLevel1) {
    return {
      label: clientLevel1,
      source: "CLIENT_LOCATION" as const,
    };
  }

  if (clientAddress) {
    return {
      label: clientAddress,
      source: "CLIENT_LOCATION" as const,
    };
  }

  return null;
}

export function getOperationalLocationContext(params: {
  installation?: OperationalLocationInstallationSource | null;
  client?: OperationalLocationClientSource | null;
  gpsLabel?: string;
  defaultLabel?: string;
}): OperationalLocationContext {
  const gpsLabel = params.gpsLabel || "Ubicación GPS disponible";
  const defaultLabel = params.defaultLabel || "Zona no definida";

  const coordinates = getOperationalCoordinates({
    installation: params.installation,
    client: params.client,
  });

  const hasGpsCoordinates =
    coordinates.latitude !== null && coordinates.longitude !== null;

  const userLocation = getUserDefinedLocationLabel({
    installation: params.installation,
    client: params.client,
  });

  if (userLocation) {
    return {
      label: userLocation.label,
      has_gps_coordinates: hasGpsCoordinates,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      source: userLocation.source,
      can_suggest_zone_from_gps: hasGpsCoordinates,
    };
  }

  if (hasGpsCoordinates) {
    return {
      label: gpsLabel,
      has_gps_coordinates: true,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      source: "GPS_ONLY",
      can_suggest_zone_from_gps: true,
    };
  }

  return {
    label: defaultLabel,
    has_gps_coordinates: false,
    latitude: null,
    longitude: null,
    source: "UNDEFINED",
    can_suggest_zone_from_gps: false,
  };
}

export function getOperationalLocationLabel(params: {
  installation?: OperationalLocationInstallationSource | null;
  client?: OperationalLocationClientSource | null;
  gpsLabel?: string;
  defaultLabel?: string;
}) {
  return getOperationalLocationContext(params).label;
}
