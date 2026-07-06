"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { resolveAppSettings } from "@/lib/config/app-settings";

type GooglePlace = {
  formatted_address?: string;
  name?: string;
  place_id?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
};

type GoogleAutocomplete = {
  addListener: (eventName: string, handler: () => void) => unknown;
  getPlace: () => GooglePlace;
};

type GooglePlacesApi = {
  Autocomplete: new (
    input: HTMLInputElement,
    options?: {
      fields?: string[];
      componentRestrictions?: {
        country: string;
      };
    },
  ) => GoogleAutocomplete;
};

type GoogleMapsRoot = {
  maps?: {
    places?: GooglePlacesApi;
    importLibrary?: (libraryName: string) => Promise<unknown>;
  };
};

type SelectedPlace = {
  reference_address: string;
  latitude: string;
  longitude: string;
  place_id?: string;
  name?: string;
};

type OperationalZonePlaceAutocompleteProps = {
  value: string;
  countryCode?: string | null;
  disabled?: boolean;
  placeholder?: string;
  onValueChange: (value: string) => void;
  onPlaceSelected: (place: SelectedPlace) => void;
};

let googlePlacesLoadPromise: Promise<void> | null = null;

function getGoogleMapsRoot() {
  if (typeof window === "undefined") {
    return null;
  }

  const browserWindow = window as Window & {
    google?: GoogleMapsRoot;
  };

  return browserWindow.google ?? null;
}

function getGooglePlacesApi() {
  return getGoogleMapsRoot()?.maps?.places ?? null;
}

function loadGooglePlacesLibrary() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (getGooglePlacesApi()) {
    return Promise.resolve();
  }

  const googleMapsRoot = getGoogleMapsRoot();

  if (googleMapsRoot?.maps?.importLibrary) {
    return googleMapsRoot.maps.importLibrary("places").then(() => undefined);
  }

  if (googlePlacesLoadPromise) {
    return googlePlacesLoadPromise;
  }

  googlePlacesLoadPromise = new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      reject(new Error("Google Maps API key is not configured."));
      return;
    }

    const existingScript = document.getElementById(
      "google-maps-places-script",
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () =>
        reject(new Error("Google Places could not be loaded.")),
      );
      return;
    }

    const script = document.createElement("script");

    script.id = "google-maps-places-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Google Places could not be loaded."));

    document.head.appendChild(script);
  });

  return googlePlacesLoadPromise;
}

function getActiveCountryCode(countryCode?: string | null) {
  const cleanCountryCode = countryCode?.trim();

  return (cleanCountryCode || resolveAppSettings().countryCode).toLowerCase();
}

export default function OperationalZonePlaceAutocomplete({
  value,
  countryCode,
  disabled = false,
  placeholder = "Busque una dirección de referencia. Ej. oficina central o punto de referencia",
  onValueChange,
  onPlaceSelected,
}: OperationalZonePlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState("");

  const activeCountryCode = useMemo(
    () => getActiveCountryCode(countryCode),
    [countryCode],
  );

  useEffect(() => {
    let isMounted = true;

    async function setupAutocomplete() {
      try {
        setLoadingPlaces(true);
        setPlacesError("");

        await loadGooglePlacesLibrary();

        const googlePlaces = getGooglePlacesApi();

        if (!isMounted || !inputRef.current || !googlePlaces) {
          return;
        }

        if (autocompleteRef.current) {
          return;
        }

        autocompleteRef.current = new googlePlaces.Autocomplete(
          inputRef.current,
          {
            fields: ["formatted_address", "geometry", "name", "place_id"],
            componentRestrictions: activeCountryCode
              ? { country: activeCountryCode }
              : undefined,
          },
        );

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();

          const location = place?.geometry?.location;
          const latitude = location?.lat?.();
          const longitude = location?.lng?.();

          const referenceAddress =
            place?.formatted_address ||
            place?.name ||
            inputRef.current?.value ||
            "";

          onValueChange(referenceAddress);

          if (
            typeof latitude === "number" &&
            Number.isFinite(latitude) &&
            typeof longitude === "number" &&
            Number.isFinite(longitude)
          ) {
            onPlaceSelected({
              reference_address: referenceAddress,
              latitude: String(latitude),
              longitude: String(longitude),
              place_id: place?.place_id,
              name: place?.name,
            });
          } else {
            onPlaceSelected({
              reference_address: referenceAddress,
              latitude: "",
              longitude: "",
              place_id: place?.place_id,
              name: place?.name,
            });
          }
        });
      } catch {
        if (isMounted) {
          setPlacesError(
            "No se pudo cargar la búsqueda de direcciones. Puede escribir la dirección manualmente.",
          );
        }
      } finally {
        if (isMounted) {
          setLoadingPlaces(false);
        }
      }
    }

    void setupAutocomplete();

    return () => {
      isMounted = false;
    };
  }, [activeCountryCode, onPlaceSelected, onValueChange]);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />

      <p className="text-xs leading-5 text-slate-400">
        Busque una dirección real. Al seleccionar una sugerencia, CLARIUS llena
        automáticamente la dirección, latitud y longitud.
      </p>

      {loadingPlaces ? (
        <p className="text-xs leading-5 text-sky-600">
          Cargando búsqueda de direcciones...
        </p>
      ) : null}

      {placesError ? (
        <p className="text-xs leading-5 text-amber-600">{placesError}</p>
      ) : null}
    </div>
  );
}
