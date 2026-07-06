import {
  DEFAULT_COUNTRY_CODE,
  normalizeCountryCode,
  type AppSettingsData,
} from "@/lib/config/app-settings";

export type CountryFeatureFlags = {
  countryCode: string;
  isCostaRica: boolean;
  usesCostaRicaLocations: boolean;
  usesCostaRicaComplianceProfile: boolean;
};

export function resolveCountryFeatures(
  settingsOrCountryCode?: AppSettingsData | string | null,
): CountryFeatureFlags {
  const rawCountryCode =
    typeof settingsOrCountryCode === "string"
      ? settingsOrCountryCode
      : settingsOrCountryCode?.country_code;

  const countryCode = normalizeCountryCode(
    rawCountryCode,
    DEFAULT_COUNTRY_CODE,
  );

  const isCostaRica = countryCode === "CR";

  return {
    countryCode,
    isCostaRica,
    usesCostaRicaLocations: isCostaRica,
    usesCostaRicaComplianceProfile: isCostaRica,
  };
}

export function isCostaRicaCountry(countryCode?: string | null) {
  return resolveCountryFeatures(countryCode).isCostaRica;
}
