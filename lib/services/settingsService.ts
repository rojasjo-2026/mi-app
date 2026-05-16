import { Prisma } from "@prisma/client";

import { DEFAULT_APP_SETTINGS } from "@/lib/settings/settingsDefaults";
import {
  createAppSettings,
  findAppSettings,
  updateAppSettings,
} from "@/lib/repositories/settingsRepository";

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
  default_currency?: "CRC" | "USD";
  default_tax_rate?: number;

  whatsapp_enabled?: boolean;
  auto_contact_enabled?: boolean;
  maintenance_contact_days_before?: number;
  automatic_send_hour?: number;
};

const SUPPORTED_COUNTRIES = [
  {
    code: "CR",
    name: "Costa Rica",
    timezone: "America/Costa_Rica",
    defaultCurrency: "CRC" as const,
    adminLevel1Label: "Región / Provincia / Estado",
    adminLevel2Label: "Ciudad / Cantón / Municipio",
    adminLevel3Label: "Distrito / Zona",
  },
];

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

  if (!Number.isFinite(numberValue)) {
    return DEFAULT_APP_SETTINGS.default_tax_rate;
  }

  return Math.min(Math.max(numberValue, 0), 100);
}

function normalizeCountryCode(value: unknown) {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  if (normalizedValue === "COSTA RICA") {
    return "CR";
  }

  const supportedCountry = SUPPORTED_COUNTRIES.find(
    (country) => country.code === normalizedValue,
  );

  return supportedCountry?.code ?? DEFAULT_APP_SETTINGS.country_code;
}

function getSupportedCountry(value: unknown) {
  const countryCode = normalizeCountryCode(value);

  return (
    SUPPORTED_COUNTRIES.find((country) => country.code === countryCode) ??
    SUPPORTED_COUNTRIES[0]
  );
}

function normalizeSettings(settings: {
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
  default_currency: "CRC" | "USD";
  default_tax_rate: Prisma.Decimal;
  whatsapp_enabled: boolean;
  auto_contact_enabled: boolean;
  maintenance_contact_days_before: number;
  automatic_send_hour: number;
  created_at: Date;
  updated_at: Date;
}) {
  const country = getSupportedCountry(settings.country_code);

  return {
    settings_id: settings.settings_id,

    company_name: settings.company_name,
    company_phone: settings.company_phone,
    company_email: settings.company_email,

    country_code: country.code,
    country_name: country.name,

    admin_level_1_label:
      settings.admin_level_1_label || country.adminLevel1Label,
    admin_level_2_label:
      settings.admin_level_2_label || country.adminLevel2Label,
    admin_level_3_label:
      settings.admin_level_3_label || country.adminLevel3Label,

    timezone: settings.timezone || country.timezone,
    default_currency: settings.default_currency || country.defaultCurrency,
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
    input.country_code ?? DEFAULT_APP_SETTINGS.country_code,
  );

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

    country_code: shouldUpdateCountry ? country.code : undefined,

    country_name: shouldUpdateCountry ? country.name : undefined,

    admin_level_1_label:
      input.admin_level_1_label === undefined
        ? undefined
        : normalizeRequiredText(
            input.admin_level_1_label,
            country.adminLevel1Label,
          ),

    admin_level_2_label:
      input.admin_level_2_label === undefined
        ? undefined
        : normalizeRequiredText(
            input.admin_level_2_label,
            country.adminLevel2Label,
          ),

    admin_level_3_label:
      input.admin_level_3_label === undefined
        ? undefined
        : (normalizeNullableText(input.admin_level_3_label) ??
          country.adminLevel3Label),

    timezone:
      input.timezone === undefined
        ? undefined
        : normalizeRequiredText(input.timezone, country.timezone),

    default_currency:
      input.default_currency === undefined
        ? undefined
        : input.default_currency === "USD"
          ? "USD"
          : "CRC",

    default_tax_rate:
      input.default_tax_rate === undefined
        ? undefined
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
