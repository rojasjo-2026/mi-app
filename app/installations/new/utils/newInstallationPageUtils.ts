import { isCostaRicaCountry } from "@/lib/config/country-features";
import { resolveAppSettings } from "@/lib/config/app-settings";
import { provincias } from "@/lib/data/costa-rica-locations";

import type {
  Client,
  CountryPreset,
  NominatimResponse,
} from "../config/newInstallationPageConfig";

export function getSpeechRecognitionLocale(countryPreset: CountryPreset) {
  if (countryPreset.countryCode === "BR") return "pt-BR";
  if (countryPreset.countryCode === "US") return "en-US";
  if (countryPreset.countryCode === "CA") return "en-CA";

  return (
    countryPreset.locale ||
    resolveAppSettings({
      country_code: countryPreset.countryCode,
    }).locale
  );
}

export function getMapsCountryRestriction(countryPreset: CountryPreset) {
  return countryPreset.countryCode.toLowerCase();
}

export function isCostaRicaPreset(countryPreset: CountryPreset) {
  return isCostaRicaCountry(countryPreset.countryCode);
}

export function getClientDisplayName(client: Client) {
  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getLocationName(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "nombre" in value) {
    return String((value as { nombre?: unknown }).nombre || "").trim();
  }

  return "";
}

function matchesLocationName(value: string, locationName: string) {
  const normalizedValue = normalizeText(value);
  const normalizedLocationName = normalizeText(locationName);

  if (!normalizedValue || !normalizedLocationName) {
    return false;
  }

  return (
    normalizedValue === normalizedLocationName ||
    normalizedValue.includes(normalizedLocationName) ||
    normalizedLocationName.includes(normalizedValue)
  );
}

export function findBestLocationMatch(address: NominatimResponse["address"]) {
  if (!address) {
    return {
      province: "",
      canton: "",
      district: "",
    };
  }

  const possibleProvinceValues = [
    address.state,
    address.county,
    address.state_district,
  ].filter(Boolean) as string[];

  const possibleCantonValues = [
    address.county,
    address.city,
    address.town,
    address.municipality,
    address.state_district,
  ].filter(Boolean) as string[];

  const possibleDistrictValues = [
    address.suburb,
    address.neighbourhood,
    address.city_district,
    address.village,
    address.hamlet,
    address.town,
    address.city,
  ].filter(Boolean) as string[];

  const matchedProvince =
    provincias.find((provincia) =>
      possibleProvinceValues.some((value) =>
        matchesLocationName(value, provincia.nombre),
      ),
    ) ?? null;

  const matchedCanton =
    matchedProvince?.cantones.find((canton) =>
      possibleCantonValues.some((value) =>
        matchesLocationName(value, canton.nombre),
      ),
    ) ?? null;

  const matchedDistrict =
    matchedCanton?.distritos.find((district) => {
      const districtName = getLocationName(district);

      return possibleDistrictValues.some((value) =>
        matchesLocationName(value, districtName),
      );
    }) ?? null;

  return {
    province: matchedProvince?.nombre ?? "",
    canton: matchedCanton?.nombre ?? "",
    district: getLocationName(matchedDistrict),
  };
}
