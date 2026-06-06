import { provincias } from "@/lib/data/costa-rica-locations";
import { getCountryPreset } from "@/lib/settings/countryPresets";
import {
  fallbackCountryPreset,
  type Client,
  type CountryPreset,
  type NominatimResponse,
} from "../config/newInstallationPageConfig";

export function getBusinessCountryPreset(countryCode?: string | null): CountryPreset {
  return getCountryPreset(countryCode) ?? fallbackCountryPreset;
}

export function getSpeechRecognitionLocale(countryPreset: CountryPreset) {
  if (countryPreset.countryCode === "BR") return "pt-BR";
  if (countryPreset.countryCode === "US") return "en-US";
  if (countryPreset.countryCode === "CA") return "en-CA";

  return countryPreset.locale || "es-CR";
}

export function getMapsCountryRestriction(countryPreset: CountryPreset) {
  return countryPreset.countryCode.toLowerCase();
}

export function isCostaRicaPreset(countryPreset: CountryPreset) {
  return countryPreset.countryCode === "CR";
}

export function getClientDisplayName(client: Client) {
  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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
  ]
    .filter(Boolean)
    .map((value) => normalizeText(String(value)));

  const possibleCantonValues = [
    address.city,
    address.town,
    address.municipality,
    address.county,
    address.city_district,
  ]
    .filter(Boolean)
    .map((value) => normalizeText(String(value)));

  const possibleDistrictValues = [
    address.village,
    address.suburb,
    address.neighbourhood,
    address.hamlet,
    address.city_district,
  ]
    .filter(Boolean)
    .map((value) => normalizeText(String(value)));

  let matchedProvince = "";
  let matchedCanton = "";
  let matchedDistrict = "";

  for (const provincia of provincias) {
    const provinciaNombre = normalizeText(provincia.nombre);

    const provinceMatched = possibleProvinceValues.some(
      (value) =>
        value === provinciaNombre ||
        value.includes(provinciaNombre) ||
        provinciaNombre.includes(value),
    );

    if (!provinceMatched) {
      continue;
    }

    matchedProvince = provincia.nombre;

    for (const canton of provincia.cantones) {
      const cantonNombre = normalizeText(canton.nombre);

      const cantonMatched = possibleCantonValues.some(
        (value) =>
          value === cantonNombre ||
          value.includes(cantonNombre) ||
          cantonNombre.includes(value),
      );

      if (!cantonMatched) {
        continue;
      }

      matchedCanton = canton.nombre;

      for (const distrito of canton.distritos) {
        const distritoNombre = normalizeText(distrito.nombre);

        const districtMatched = possibleDistrictValues.some(
          (value) =>
            value === distritoNombre ||
            value.includes(distritoNombre) ||
            distritoNombre.includes(value),
        );

        if (districtMatched) {
          matchedDistrict = distrito.nombre;
          break;
        }
      }

      break;
    }

    break;
  }

  if (!matchedProvince) {
    for (const provincia of provincias) {
      for (const canton of provincia.cantones) {
        const cantonNombre = normalizeText(canton.nombre);

        const cantonMatched = possibleCantonValues.some(
          (value) =>
            value === cantonNombre ||
            value.includes(cantonNombre) ||
            cantonNombre.includes(value),
        );

        if (!cantonMatched) {
          continue;
        }

        matchedProvince = provincia.nombre;
        matchedCanton = canton.nombre;

        for (const distrito of canton.distritos) {
          const distritoNombre = normalizeText(distrito.nombre);

          const districtMatched = possibleDistrictValues.some(
            (value) =>
              value === distritoNombre ||
              value.includes(distritoNombre) ||
              distritoNombre.includes(value),
          );

          if (districtMatched) {
            matchedDistrict = distrito.nombre;
            break;
          }
        }

        return {
          province: matchedProvince,
          canton: matchedCanton,
          district: matchedDistrict,
        };
      }
    }
  }

  return {
    province: matchedProvince,
    canton: matchedCanton,
    district: matchedDistrict,
  };
}

