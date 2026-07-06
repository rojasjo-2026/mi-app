import { DEFAULT_APP_SETTINGS } from "@/lib/settings/settingsDefaults";
import {
  COUNTRY_PRESETS,
  getCountryPreset,
  type CountryPreset,
} from "@/lib/settings/countryPresets";

export type AppSettingsData = {
  country_code?: string | null;
  country_name?: string | null;
  default_currency?: string | null;
  secondary_currency?: string | null;
  timezone?: string | null;
  date_format?: string | null;
  phone_country_code?: string | null;
  default_tax_rate?: number | null;
  admin_level_1_label?: string | null;
  admin_level_2_label?: string | null;
  admin_level_3_label?: string | null;
};

export type AppSettingsResponse = {
  success: boolean;
  data?: AppSettingsData | null;
  message?: string;
};

export type BusinessCountryMeta = {
  countryPreset: CountryPreset;
  countryCode: string;
  countryName: string;
  currency: string;
  secondaryCurrency: string | null;
  locale: string;
  timezone: string;
  dateFormat: string;
  phoneCountryCode: string;
  defaultTaxRate: number;
  adminLevel1Label: string;
  adminLevel2Label: string;
  adminLevel3Label: string | null;
};

function getFirstCountryPreset(): CountryPreset {
  const firstPreset = Object.values(COUNTRY_PRESETS)[0];

  if (!firstPreset) {
    throw new Error("No country presets were found.");
  }

  return firstPreset;
}

const firstCountryPreset = getFirstCountryPreset();

function normalizeCountryCodeValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

export function normalizeCountryCode(
  value?: string | null,
  fallback?: string | null,
) {
  const countryCode = normalizeCountryCodeValue(value);

  const fallbackCountryCode =
    normalizeCountryCodeValue(fallback) ||
    normalizeCountryCodeValue(DEFAULT_APP_SETTINGS.country_code) ||
    firstCountryPreset.countryCode;

  return countryCode || fallbackCountryCode;
}

export const DEFAULT_COUNTRY_CODE = normalizeCountryCode(
  DEFAULT_APP_SETTINGS.country_code,
  firstCountryPreset.countryCode,
);

export const fallbackCountryPreset =
  getCountryPreset(DEFAULT_COUNTRY_CODE) ?? firstCountryPreset;

export const DEFAULT_CURRENCY_CODE = String(
  DEFAULT_APP_SETTINGS.default_currency ||
    fallbackCountryPreset.primaryCurrency,
).toUpperCase();

export function getBusinessCountryPreset(countryCode?: string | null) {
  const normalizedCountryCode = normalizeCountryCode(
    countryCode,
    DEFAULT_COUNTRY_CODE,
  );

  return getCountryPreset(normalizedCountryCode) ?? fallbackCountryPreset;
}

export function getBusinessCountryMeta(
  settings?: AppSettingsData | null,
): BusinessCountryMeta {
  const countryPreset = getBusinessCountryPreset(settings?.country_code);

  return {
    countryPreset,
    countryCode: countryPreset.countryCode,
    countryName: countryPreset.countryName,
    currency: String(
      settings?.default_currency ||
        countryPreset.primaryCurrency ||
        DEFAULT_CURRENCY_CODE,
    ).toUpperCase(),
    secondaryCurrency:
      settings?.secondary_currency ?? countryPreset.secondaryCurrency ?? null,
    locale: countryPreset.locale,
    timezone: settings?.timezone || countryPreset.defaultTimezone,
    dateFormat: settings?.date_format || countryPreset.dateFormat,
    phoneCountryCode: settings?.phone_country_code || countryPreset.phonePrefix,
    defaultTaxRate:
      typeof settings?.default_tax_rate === "number"
        ? settings.default_tax_rate
        : countryPreset.defaultTaxRate,
    adminLevel1Label:
      settings?.admin_level_1_label || countryPreset.adminLevel1Label,
    adminLevel2Label:
      settings?.admin_level_2_label || countryPreset.adminLevel2Label,
    adminLevel3Label:
      settings?.admin_level_3_label ?? countryPreset.adminLevel3Label ?? null,
  };
}
