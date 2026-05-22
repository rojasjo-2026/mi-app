import type { CountryPreset } from "./index";

export const EUROPE_AFRICA_COUNTRY_PRESETS: Record<string, CountryPreset> = {
  ES: {
    countryCode: "ES",
    countryName: "España",
    primaryCurrency: "EUR",
    secondaryCurrency: "USD",
    defaultTimezone: "Europe/Madrid",
    timezones: [
      {
        value: "Europe/Madrid",
        label: "España peninsular / Baleares / Ceuta / Melilla",
      },
      { value: "Atlantic/Canary", label: "Islas Canarias" },
    ],
    phonePrefix: "+34",
    defaultTaxRate: 21,
    adminLevel1Label: "Comunidad autónoma",
    adminLevel2Label: "Provincia",
    adminLevel3Label: "Municipio / Localidad",
    dateFormat: "DD/MM/YYYY",
  },

  PT: {
    countryCode: "PT",
    countryName: "Portugal",
    primaryCurrency: "EUR",
    secondaryCurrency: "USD",
    defaultTimezone: "Europe/Lisbon",
    timezones: [
      { value: "Europe/Lisbon", label: "Portugal continental / Madeira" },
      { value: "Atlantic/Azores", label: "Azores" },
    ],
    phonePrefix: "+351",
    defaultTaxRate: 23,
    adminLevel1Label: "Distrito / Región autónoma",
    adminLevel2Label: "Municipio",
    adminLevel3Label: "Freguesia / Parroquia civil",
    dateFormat: "DD/MM/YYYY",
  },

  GQ: {
    countryCode: "GQ",
    countryName: "Guinea Ecuatorial",
    primaryCurrency: "XAF",
    secondaryCurrency: "USD",
    defaultTimezone: "Africa/Malabo",
    timezones: [{ value: "Africa/Malabo", label: "Guinea Ecuatorial Time" }],
    phonePrefix: "+240",
    defaultTaxRate: 15,
    adminLevel1Label: "Provincia",
    adminLevel2Label: "Distrito",
    adminLevel3Label: "Municipio / Consejo de poblado",
    dateFormat: "DD/MM/YYYY",
  },
};
