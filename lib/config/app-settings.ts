import {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_CURRENCY_CODE,
  fallbackCountryPreset,
  getBusinessCountryMeta,
  getBusinessCountryPreset,
  normalizeCountryCode,
  type AppSettingsData,
  type AppSettingsResponse,
  type BusinessCountryMeta,
} from "@/lib/settings/appSettingsUtils";

export type { AppSettingsData, AppSettingsResponse, BusinessCountryMeta };

export {
  DEFAULT_COUNTRY_CODE,
  DEFAULT_CURRENCY_CODE,
  fallbackCountryPreset,
  getBusinessCountryMeta,
  getBusinessCountryPreset,
  normalizeCountryCode,
};

export type ResolvedAppSettings = BusinessCountryMeta;

export function resolveAppSettings(
  settings?: AppSettingsData | null,
): ResolvedAppSettings {
  return getBusinessCountryMeta(settings);
}

export function getActiveCountryCode(settings?: AppSettingsData | null) {
  return resolveAppSettings(settings).countryCode;
}

export function getActiveCurrency(settings?: AppSettingsData | null) {
  return resolveAppSettings(settings).currency;
}

export function getActiveLocale(settings?: AppSettingsData | null) {
  return resolveAppSettings(settings).locale;
}

export function getActiveTimezone(settings?: AppSettingsData | null) {
  return resolveAppSettings(settings).timezone;
}

export function getActivePhoneCountryCode(settings?: AppSettingsData | null) {
  return resolveAppSettings(settings).phoneCountryCode;
}
