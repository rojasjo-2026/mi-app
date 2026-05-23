import { EUROPE_AFRICA_COUNTRY_PRESETS } from "./europeAfrica";
import { LATIN_AMERICA_COUNTRY_PRESETS } from "./latinAmerica";
import { NORTH_AMERICA_COUNTRY_PRESETS } from "./northAmerica";

export type CountryTimezoneOption = {
  value: string;
  label: string;
};

export type CountryTaxMode = "NATIONAL" | "REGIONAL" | "MIXED" | "NONE";

export type CountryIdentificationType = {
  code: string;
  label: string;
  appliesTo: "PERSON" | "COMPANY" | "BOTH";
};

export type CountryPhoneValidation = {
  minDigits: number;
  maxDigits: number;
  nationalExample: string;
  internationalExample: string;
  requiresCountryPrefix: boolean;
  notes?: string;
};

export type CountryRegionalTaxRules = {
  appliesByRegion: boolean;
  description: string;
  notes?: string;
};

export type CountryPreset = {
  countryCode: string;
  countryName: string;
  primaryCurrency: string;
  secondaryCurrency?: string | null;
  currencySymbol: string;
  locale: string;
  defaultTimezone: string;
  timezones: CountryTimezoneOption[];
  phonePrefix: string;
  phoneExample: string;
  phoneValidation: CountryPhoneValidation;
  defaultTaxRate: number;
  taxLabel: string;
  taxMode: CountryTaxMode;
  regionalTaxRules: CountryRegionalTaxRules;
  identificationTypes: CountryIdentificationType[];
  addressExample: string;
  adminLevel1Label: string;
  adminLevel2Label: string;
  adminLevel3Label?: string | null;
  dateFormat: string;
};

export const COUNTRY_PRESETS: Record<string, CountryPreset> = {
  ...LATIN_AMERICA_COUNTRY_PRESETS,
  ...NORTH_AMERICA_COUNTRY_PRESETS,
  ...EUROPE_AFRICA_COUNTRY_PRESETS,
};

export function getCountryPreset(
  countryCode?: string | null,
): CountryPreset | null {
  if (!countryCode) return null;

  return COUNTRY_PRESETS[countryCode.toUpperCase()] ?? null;
}

export const COUNTRY_PRESET_OPTIONS = Object.values(COUNTRY_PRESETS)
  .map((preset) => ({
    value: preset.countryCode,
    label: `${preset.countryCode} - ${preset.countryName}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));
