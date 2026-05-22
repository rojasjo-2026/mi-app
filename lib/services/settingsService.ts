import { Prisma, type CurrencyCode } from "@prisma/client";

import { DEFAULT_APP_SETTINGS } from "@/lib/settings/settingsDefaults";
import {
  createAppSettings,
  findAppSettings,
  updateAppSettings,
} from "@/lib/repositories/settingsRepository";
import {
  COUNTRY_PRESETS,
  getCountryPreset,
  type CountryPreset,
} from "@/lib/settings/countryPresets";

type UpdateSettingsInput = {
  company_name?: string | null;
  company_phone?: string | null;
  company_email?: string | null;

  country_code?: string;
  country_name?: string;

  admin_level_1_label?: string;
  admin_level_2_label?: string;
  admin_level_3_label?: string | null;

  timezone?: string;
  date_format?: string;
  phone_country_code?: string;

  default_currency?: CurrencyCode | string;
  secondary_currency?: CurrencyCode | string | null;
  default_tax_rate?: number;

  whatsapp_enabled?: boolean;
  auto_contact_enabled?: boolean;
  maintenance_contact_days_before?: number;
  automatic_send_hour?: number;
};

type AppSettingsRecord = {
  settings_id: string;

  company_name: string | null;
  company_phone: string | null;
  company_email: string | null;

  country_code: string;
  country_name: string;

  admin_level_1_label: string;
  admin_level_2_label: string;
  admin_level_3_label: string | null;

  timezone: string;
  date_format: string;
  phone_country_code: string;

  default_currency: CurrencyCode;
  secondary_currency: CurrencyCode | null;
  default_tax_rate: Prisma.Decimal;

  whatsapp_enabled: boolean;
  auto_contact_enabled: boolean;
  maintenance_contact_days_before: number;
  automatic_send_hour: number;

  created_at: Date;
  updated_at: Date;
};

const DEFAULT_COUNTRY_CODE = DEFAULT_APP_SETTINGS.country_code || "CR";

const SUPPORTED_CURRENCY_CODES: CurrencyCode[] = [
  "ARS",
  "BOB",
  "BRL",
  "CAD",
  "CLP",
  "COP",
  "CRC",
  "DOP",
  "EUR",
  "GTQ",
  "HNL",
  "MXN",
  "NIO",
  "PEN",
  "PYG",
  "USD",
  "UYU",
  "VES",
  "XAF",
] as CurrencyCode[];

function getFallbackCountryPreset(): CountryPreset {
  const defaultPreset = getCountryPreset(DEFAULT_COUNTRY_CODE);
  const firstPreset = Object.values(COUNTRY_PRESETS)[0];

  if (defaultPreset) {
    return defaultPreset;
  }

  if (firstPreset) {
    return firstPreset;
  }

  throw new Error("No country presets were found.");
}

function normalizeNullableText(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeRequiredText(value: unknown, fallback: string) {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(numberValue), min), max);
}

function normalizeTaxRate(value: unknown) {
  const numberValue = Number(value);
  const fallbackTaxRate = Number(DEFAULT_APP_SETTINGS.default_tax_rate ?? 13);

  if (!Number.isFinite(numberValue)) {
    return Number.isFinite(fallbackTaxRate) ? fallbackTaxRate : 13;
  }

  return Math.min(Math.max(numberValue, 0), 100);
}

function normalizeCurrencyCode(
  value: unknown,
  fallback: CurrencyCode = "CRC",
): CurrencyCode {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase();

  return SUPPORTED_CURRENCY_CODES.includes(normalizedValue as CurrencyCode)
    ? (normalizedValue as CurrencyCode)
    : fallback;
}

function normalizeOptionalCurrencyCode(
  value: unknown,
  fallback: CurrencyCode | null = null,
): CurrencyCode | null {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase();

  if (!normalizedValue) {
    return fallback;
  }

  return SUPPORTED_CURRENCY_CODES.includes(normalizedValue as CurrencyCode)
    ? (normalizedValue as CurrencyCode)
    : fallback;
}

function normalizeCountryCode(value: unknown) {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  if (normalizedValue === "COSTA RICA") {
    return "CR";
  }

  const presetByCode = getCountryPreset(normalizedValue);

  if (presetByCode) {
    return presetByCode.countryCode;
  }

  const presetByName = Object.values(COUNTRY_PRESETS).find(
    (country) => country.countryName.toUpperCase() === normalizedValue,
  );

  return presetByName?.countryCode ?? DEFAULT_COUNTRY_CODE;
}

function getSupportedCountry(value: unknown): CountryPreset {
  const countryCode = normalizeCountryCode(value);

  return getCountryPreset(countryCode) ?? getFallbackCountryPreset();
}

function getPresetDefaultCurrency(country: CountryPreset): CurrencyCode {
  return normalizeCurrencyCode(country.primaryCurrency, "CRC");
}

function getPresetSecondaryCurrency(
  country: CountryPreset,
): CurrencyCode | null {
  return normalizeOptionalCurrencyCode(country.secondaryCurrency, null);
}

function normalizeSettings(settings: AppSettingsRecord) {
  const country = getSupportedCountry(settings.country_code);
  const presetDefaultCurrency = getPresetDefaultCurrency(country);
  const presetSecondaryCurrency = getPresetSecondaryCurrency(country);

  return {
    settings_id: settings.settings_id,

    company_name: settings.company_name,
    company_phone: settings.company_phone,
    company_email: settings.company_email,

    country_code: country.countryCode,
    country_name: country.countryName,

    admin_level_1_label:
      settings.admin_level_1_label || country.adminLevel1Label,
    admin_level_2_label:
      settings.admin_level_2_label || country.adminLevel2Label,
    admin_level_3_label:
      settings.admin_level_3_label || country.adminLevel3Label,

    timezone: settings.timezone || country.defaultTimezone,
    date_format: settings.date_format || country.dateFormat,
    phone_country_code: settings.phone_country_code || country.phonePrefix,

    default_currency: settings.default_currency || presetDefaultCurrency,
    secondary_currency: settings.secondary_currency ?? presetSecondaryCurrency,
    default_tax_rate: settings.default_tax_rate.toNumber(),

    whatsapp_enabled: settings.whatsapp_enabled,
    auto_contact_enabled: settings.auto_contact_enabled,
    maintenance_contact_days_before: settings.maintenance_contact_days_before,
    automatic_send_hour: settings.automatic_send_hour,

    created_at: settings.created_at,
    updated_at: settings.updated_at,
  };
}

export async function getOrCreateAppSettingsService() {
  const existingSettings = await findAppSettings();

  if (existingSettings) {
    return normalizeSettings(existingSettings);
  }

  const createdSettings = await createAppSettings();

  return normalizeSettings(createdSettings);
}

export async function updateAppSettingsService(input: UpdateSettingsInput) {
  const currentSettings = await findAppSettings();

  const settings = currentSettings ?? (await createAppSettings());

  const shouldUpdateCountry =
    input.country_code !== undefined || input.country_name !== undefined;

  const country = getSupportedCountry(
    input.country_code ?? settings.country_code,
  );
  const presetDefaultCurrency = getPresetDefaultCurrency(country);
  const presetSecondaryCurrency = getPresetSecondaryCurrency(country);

  const data: Prisma.AppSettingsUpdateInput = {
    company_name:
      input.company_name === undefined
        ? undefined
        : normalizeNullableText(input.company_name),

    company_phone:
      input.company_phone === undefined
        ? undefined
        : normalizeNullableText(input.company_phone),

    company_email:
      input.company_email === undefined
        ? undefined
        : normalizeNullableText(input.company_email),

    country_code: shouldUpdateCountry ? country.countryCode : undefined,

    country_name: shouldUpdateCountry ? country.countryName : undefined,

    admin_level_1_label:
      input.admin_level_1_label === undefined
        ? shouldUpdateCountry
          ? country.adminLevel1Label
          : undefined
        : normalizeRequiredText(
            input.admin_level_1_label,
            country.adminLevel1Label,
          ),

    admin_level_2_label:
      input.admin_level_2_label === undefined
        ? shouldUpdateCountry
          ? country.adminLevel2Label
          : undefined
        : normalizeRequiredText(
            input.admin_level_2_label,
            country.adminLevel2Label,
          ),

    admin_level_3_label:
      input.admin_level_3_label === undefined
        ? shouldUpdateCountry
          ? country.adminLevel3Label
          : undefined
        : (normalizeNullableText(input.admin_level_3_label) ??
          country.adminLevel3Label),

    timezone:
      input.timezone === undefined
        ? shouldUpdateCountry
          ? country.defaultTimezone
          : undefined
        : normalizeRequiredText(input.timezone, country.defaultTimezone),

    date_format:
      input.date_format === undefined
        ? shouldUpdateCountry
          ? country.dateFormat
          : undefined
        : normalizeRequiredText(input.date_format, country.dateFormat),

    phone_country_code:
      input.phone_country_code === undefined
        ? shouldUpdateCountry
          ? country.phonePrefix
          : undefined
        : normalizeRequiredText(input.phone_country_code, country.phonePrefix),

    default_currency:
      input.default_currency === undefined
        ? shouldUpdateCountry
          ? presetDefaultCurrency
          : undefined
        : normalizeCurrencyCode(input.default_currency, presetDefaultCurrency),

    secondary_currency:
      input.secondary_currency === undefined
        ? shouldUpdateCountry
          ? presetSecondaryCurrency
          : undefined
        : normalizeOptionalCurrencyCode(
            input.secondary_currency,
            presetSecondaryCurrency,
          ),

    default_tax_rate:
      input.default_tax_rate === undefined
        ? shouldUpdateCountry
          ? new Prisma.Decimal(country.defaultTaxRate)
          : undefined
        : new Prisma.Decimal(normalizeTaxRate(input.default_tax_rate)),

    whatsapp_enabled:
      input.whatsapp_enabled === undefined
        ? undefined
        : Boolean(input.whatsapp_enabled),

    auto_contact_enabled:
      input.auto_contact_enabled === undefined
        ? undefined
        : Boolean(input.auto_contact_enabled),

    maintenance_contact_days_before:
      input.maintenance_contact_days_before === undefined
        ? undefined
        : normalizeInteger(
            input.maintenance_contact_days_before,
            DEFAULT_APP_SETTINGS.maintenance_contact_days_before,
            1,
            365,
          ),

    automatic_send_hour:
      input.automatic_send_hour === undefined
        ? undefined
        : normalizeInteger(
            input.automatic_send_hour,
            DEFAULT_APP_SETTINGS.automatic_send_hour,
            0,
            23,
          ),
  };

  const updatedSettings = await updateAppSettings(settings.settings_id, data);

  return normalizeSettings(updatedSettings);
}
