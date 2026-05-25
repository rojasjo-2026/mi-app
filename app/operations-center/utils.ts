import type { CalendarEvent } from "./types";

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

export function buildGoogleMapsUrl(params: {
  origin: string;
  stops: string[];
}) {
  const cleanOrigin = params.origin.trim();
  const cleanStops = params.stops
    .map((stop) => stop.trim())
    .filter((stop) => stop.length > 0);

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
