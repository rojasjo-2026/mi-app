"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";

type Installation = {
  installation_id: string;
  latitude: string | number | null;
  longitude: string | number | null;
  installation_date: string;
  installation_status: string;
  client: {
    first_name: string;
    last_name_1: string;
  } | null;
};

type GoogleMapPosition = {
  lat: number;
  lng: number;
};

type GoogleMapOptions = {
  center: GoogleMapPosition;
  zoom: number;
};

type GoogleMap = {
  setCenter: (position: GoogleMapPosition) => void;
  setZoom: (zoom: number) => void;
  fitBounds: (bounds: GoogleLatLngBounds) => void;
};

type GoogleLatLngBounds = {
  extend: (position: GoogleMapPosition) => void;
};

type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void;
  addListener: (eventName: string, handler: () => void) => unknown;
};

type GoogleMarkerOptions = {
  position: GoogleMapPosition;
  map: GoogleMap;
  icon?: {
    path: string | number;
    scale: number;
    fillColor: string;
    fillOpacity: number;
    strokeWeight: number;
  };
};

type GoogleInfoWindow = {
  open: (map: GoogleMap, marker: GoogleMarker) => void;
};

type GoogleInfoWindowOptions = {
  content: string;
};

type GoogleMapsApi = {
  Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMap;
  Marker: new (options: GoogleMarkerOptions) => GoogleMarker;
  InfoWindow: new (options: GoogleInfoWindowOptions) => GoogleInfoWindow;
  LatLngBounds: new () => GoogleLatLngBounds;
  SymbolPath: {
    CIRCLE: string | number;
  };
};

type MapPoint = {
  installation: Installation;
  lat: number;
  lng: number;
};

function getGoogleMapsApi() {
  if (typeof window === "undefined") {
    return null;
  }

  const browserWindow = window as Window & {
    google?: {
      maps?: GoogleMapsApi;
    };
  };

  return browserWindow.google?.maps ?? null;
}

function getRecordValue(source: unknown, key: string) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return undefined;
  }

  return (source as Record<string, unknown>)[key];
}

function getObjectValue(source: unknown, key: string) {
  const value = getRecordValue(source, key);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value;
}

function getNumberValue(source: unknown, keys: string[]) {
  for (const key of keys) {
    const value = getRecordValue(source, key);

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function getMapDefaultCenter(businessCountryMeta: unknown) {
  const countryPreset = getObjectValue(businessCountryMeta, "countryPreset");
  const metaCenter = getObjectValue(businessCountryMeta, "center");
  const presetCenter = getObjectValue(countryPreset, "center");

  const lat =
    getNumberValue(businessCountryMeta, [
      "latitude",
      "lat",
      "defaultLatitude",
      "default_latitude",
      "mapLatitude",
      "map_latitude",
      "centerLat",
      "center_lat",
    ]) ??
    getNumberValue(countryPreset, [
      "latitude",
      "lat",
      "defaultLatitude",
      "default_latitude",
      "mapLatitude",
      "map_latitude",
      "centerLat",
      "center_lat",
    ]) ??
    getNumberValue(metaCenter, ["latitude", "lat"]) ??
    getNumberValue(presetCenter, ["latitude", "lat"]) ??
    0;

  const lng =
    getNumberValue(businessCountryMeta, [
      "longitude",
      "lng",
      "defaultLongitude",
      "default_longitude",
      "mapLongitude",
      "map_longitude",
      "centerLng",
      "center_lng",
    ]) ??
    getNumberValue(countryPreset, [
      "longitude",
      "lng",
      "defaultLongitude",
      "default_longitude",
      "mapLongitude",
      "map_longitude",
      "centerLng",
      "center_lng",
    ]) ??
    getNumberValue(metaCenter, ["longitude", "lng"]) ??
    getNumberValue(presetCenter, ["longitude", "lng"]) ??
    0;

  const zoom =
    getNumberValue(businessCountryMeta, [
      "zoom",
      "defaultZoom",
      "default_zoom",
    ]) ??
    getNumberValue(countryPreset, ["zoom", "defaultZoom", "default_zoom"]) ??
    2;

  return {
    lat,
    lng,
    zoom,
  };
}

function parseCoordinate(value: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function getInstallationMapPoints(installations: Installation[]) {
  return installations.reduce<MapPoint[]>((points, installation) => {
    const lat = parseCoordinate(installation.latitude);
    const lng = parseCoordinate(installation.longitude);

    if (lat === null || lng === null) {
      return points;
    }

    points.push({
      installation,
      lat,
      lng,
    });

    return points;
  }, []);
}

function getMarkerColor(installationDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(installationDate);
  date.setHours(0, 0, 0, 0);

  if (Number.isNaN(date.getTime())) {
    return "green";
  }

  if (date.getTime() < today.getTime()) {
    return "red";
  }

  if (date.getTime() === today.getTime()) {
    return "yellow";
  }

  return "green";
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  try {
    return date.toLocaleDateString(locale || "es");
  } catch {
    return date.toLocaleDateString("es");
  }
}

function getClientName(client: Installation["client"]) {
  if (!client) {
    return "Cliente sin nombre";
  }

  return `${client.first_name} ${client.last_name_1}`.trim();
}

function buildInfoWindowContent(installation: Installation, locale: string) {
  return [
    "<div>",
    `<strong>${getClientName(installation.client)}</strong><br/>`,
    `Fecha: ${formatDate(installation.installation_date, locale)}`,
    "</div>",
  ].join("");
}

export default function MapPage() {
  const { businessCountryMeta } = useAppSettings();
  const locale = businessCountryMeta.locale || "es";

  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [installations, setInstallations] = useState<Installation[]>([]);

  const mapPoints = useMemo(
    () => getInstallationMapPoints(installations),
    [installations],
  );

  useEffect(() => {
    async function loadData() {
      const res = await fetch("/api/installations");
      const data = await res.json();

      if (data.success) {
        setInstallations(data.data);
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (getGoogleMapsApi()) {
      setMapsReady(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");

    if (existingScript) {
      const handleLoad = () => setMapsReady(true);

      existingScript.addEventListener("load", handleLoad);

      return () => {
        existingScript.removeEventListener("load", handleLoad);
      };
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) return;

    const script = document.createElement("script");

    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => setMapsReady(true));

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapsReady) return;
    if (!mapRef.current) return;

    const googleMaps = getGoogleMapsApi();

    if (!googleMaps) return;

    const defaultCenter = getMapDefaultCenter(businessCountryMeta);
    const firstPoint = mapPoints[0];

    const map = new googleMaps.Map(mapRef.current, {
      center: firstPoint
        ? { lat: firstPoint.lat, lng: firstPoint.lng }
        : { lat: defaultCenter.lat, lng: defaultCenter.lng },
      zoom: firstPoint ? 10 : defaultCenter.zoom,
    });

    const markers: GoogleMarker[] = [];

    if (mapPoints.length > 1) {
      const bounds = new googleMaps.LatLngBounds();

      mapPoints.forEach((point) => {
        bounds.extend({ lat: point.lat, lng: point.lng });
      });

      map.fitBounds(bounds);
    }

    if (mapPoints.length === 1 && firstPoint) {
      map.setCenter({ lat: firstPoint.lat, lng: firstPoint.lng });
      map.setZoom(14);
    }

    mapPoints.forEach((point) => {
      const { installation } = point;
      const color = getMarkerColor(installation.installation_date);

      const marker = new googleMaps.Marker({
        position: {
          lat: point.lat,
          lng: point.lng,
        },
        map,
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 1,
          strokeWeight: 1,
        },
      });

      const info = new googleMaps.InfoWindow({
        content: buildInfoWindowContent(installation, locale),
      });

      marker.addListener("click", () => {
        info.open(map, marker);
      });

      markers.push(marker);
    });

    return () => {
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [businessCountryMeta, locale, mapPoints, mapsReady]);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Mapa de Instalaciones</h1>
      <div ref={mapRef} style={{ width: "100%", height: "600px" }} />
    </div>
  );
}
