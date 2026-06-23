import type { CalendarEvent } from "./types";

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getEventTypeLabel(event: CalendarEvent) {
  if (event.entity_type === "installation") {
    return "Instalación";
  }

  if (event.entity_type === "follow_up") {
    return "Mantenimiento";
  }

  return "Trabajo";
}

export function getEventBadgeClasses(event: CalendarEvent) {
  if (event.entity_type === "installation") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (event.entity_type === "follow_up") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function normalizeRouteStops(stops: string[]) {
  const seenStops = new Set<string>();

  return stops.reduce<string[]>((accumulator, stop) => {
    const cleanStop = stop.trim();

    if (!cleanStop) {
      return accumulator;
    }

    const stopKey = cleanStop.toLowerCase();

    if (seenStops.has(stopKey)) {
      return accumulator;
    }

    seenStops.add(stopKey);
    accumulator.push(cleanStop);

    return accumulator;
  }, []);
}

export function parseRouteCoordinate(value: string): RouteCoordinate | null {
  const cleanValue = value.trim();
  const match = cleanValue.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);

  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

export function formatRouteCoordinate(coordinate: RouteCoordinate) {
  return `${coordinate.latitude},${coordinate.longitude}`;
}

function calculateDistanceKm(
  fromCoordinate: RouteCoordinate,
  toCoordinate: RouteCoordinate,
) {
  const earthRadiusKm = 6371;

  const latitudeDistance =
    ((toCoordinate.latitude - fromCoordinate.latitude) * Math.PI) / 180;
  const longitudeDistance =
    ((toCoordinate.longitude - fromCoordinate.longitude) * Math.PI) / 180;

  const fromLatitude = (fromCoordinate.latitude * Math.PI) / 180;
  const toLatitude = (toCoordinate.latitude * Math.PI) / 180;

  const haversineValue =
    Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2) +
    Math.sin(longitudeDistance / 2) *
      Math.sin(longitudeDistance / 2) *
      Math.cos(fromLatitude) *
      Math.cos(toLatitude);

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * centralAngle;
}

export function sortRouteStopsByNearestOrigin(params: {
  origin: RouteCoordinate | null;
  stops: string[];
}) {
  const cleanStops = normalizeRouteStops(params.stops);

  if (!params.origin || cleanStops.length <= 1) {
    return {
      stops: cleanStops,
      sorted: false,
    };
  }

  const coordinateStops: {
    stop: string;
    coordinate: RouteCoordinate;
  }[] = [];

  for (const stop of cleanStops) {
    const coordinate = parseRouteCoordinate(stop);

    if (!coordinate) {
      return {
        stops: cleanStops,
        sorted: false,
      };
    }

    coordinateStops.push({
      stop,
      coordinate,
    });
  }

  const remainingStops = [...coordinateStops];
  const orderedStops: string[] = [];
  let currentCoordinate = params.origin;

  while (remainingStops.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistanceKm(
      currentCoordinate,
      remainingStops[0].coordinate,
    );

    for (let index = 1; index < remainingStops.length; index += 1) {
      const distance = calculateDistanceKm(
        currentCoordinate,
        remainingStops[index].coordinate,
      );

      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    }

    const [nearestStop] = remainingStops.splice(nearestIndex, 1);

    orderedStops.push(nearestStop.stop);
    currentCoordinate = nearestStop.coordinate;
  }

  return {
    stops: orderedStops,
    sorted: true,
  };
}

export function buildGoogleMapsUrl(params: {
  origin: string;
  stops: string[];
}) {
  const cleanOrigin = params.origin.trim();
  const cleanStops = normalizeRouteStops(params.stops);

  if (!cleanOrigin || cleanStops.length === 0) {
    return "";
  }

  const destination = cleanStops[cleanStops.length - 1];
  const waypoints = cleanStops.slice(0, -1);

  const url = new URL("https://www.google.com/maps/dir/");

  url.searchParams.set("api", "1");
  url.searchParams.set("origin", cleanOrigin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("travelmode", "driving");

  if (waypoints.length > 0) {
    url.searchParams.set("waypoints", waypoints.join("|"));
  }

  return url.toString();
}
