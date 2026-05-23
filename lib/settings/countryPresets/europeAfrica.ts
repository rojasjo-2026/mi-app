import type { CountryPreset } from "./index";

export const EUROPE_AFRICA_COUNTRY_PRESETS: Record<string, CountryPreset> = {
  ES: {
    countryCode: "ES",
    countryName: "España",
    primaryCurrency: "EUR",
    secondaryCurrency: "USD",
    currencySymbol: "€",
    locale: "es-ES",
    defaultTimezone: "Europe/Madrid",
    timezones: [
      {
        value: "Europe/Madrid",
        label: "España peninsular / Baleares / Ceuta / Melilla",
      },
      { value: "Atlantic/Canary", label: "Islas Canarias" },
    ],
    phonePrefix: "+34",
    phoneExample: "+34 600 123 456",
    phoneValidation: {
      minDigits: 9,
      maxDigits: 9,
      nationalExample: "600 123 456",
      internationalExample: "+34 600 123 456",
      requiresCountryPrefix: false,
      notes: "Formato base de 9 dígitos para teléfonos nacionales.",
    },
    defaultTaxRate: 21,
    taxLabel: "IVA",
    taxMode: "MIXED",
    regionalTaxRules: {
      appliesByRegion: true,
      description:
        "El IVA general aplica de forma nacional, pero Canarias, Ceuta y Melilla pueden requerir reglas especiales.",
      notes:
        "Usar este valor como sugerencia inicial y ajustar por región si corresponde.",
    },
    identificationTypes: [
      { code: "DNI", label: "DNI", appliesTo: "PERSON" },
      { code: "NIE", label: "NIE", appliesTo: "PERSON" },
      { code: "NIF", label: "NIF", appliesTo: "BOTH" },
      { code: "CIF", label: "CIF", appliesTo: "COMPANY" },
      { code: "PASSPORT", label: "Pasaporte", appliesTo: "PERSON" },
      { code: "OTHER", label: "Otro", appliesTo: "BOTH" },
    ],
    addressExample:
      "Comunidad autónoma, provincia, municipio/localidad, dirección exacta",
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
    currencySymbol: "€",
    locale: "pt-PT",
    defaultTimezone: "Europe/Lisbon",
    timezones: [
      { value: "Europe/Lisbon", label: "Portugal continental / Madeira" },
      { value: "Atlantic/Azores", label: "Azores" },
    ],
    phonePrefix: "+351",
    phoneExample: "+351 912 345 678",
    phoneValidation: {
      minDigits: 9,
      maxDigits: 9,
      nationalExample: "912 345 678",
      internationalExample: "+351 912 345 678",
      requiresCountryPrefix: false,
      notes: "Formato base de 9 dígitos para teléfonos nacionales.",
    },
    defaultTaxRate: 23,
    taxLabel: "IVA",
    taxMode: "MIXED",
    regionalTaxRules: {
      appliesByRegion: true,
      description:
        "La tasa puede variar entre Portugal continental, Madeira y Azores.",
      notes:
        "Usar el valor continental como sugerencia inicial y ajustar por región si corresponde.",
    },
    identificationTypes: [
      { code: "NIF", label: "NIF", appliesTo: "BOTH" },
      {
        code: "CARTAO_CIDADAO",
        label: "Cartão de Cidadão",
        appliesTo: "PERSON",
      },
      { code: "NIPC", label: "NIPC", appliesTo: "COMPANY" },
      { code: "PASSPORT", label: "Passaporte", appliesTo: "PERSON" },
      { code: "OTHER", label: "Outro", appliesTo: "BOTH" },
    ],
    addressExample:
      "Distrito/región autónoma, municipio, freguesia, dirección exacta",
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
    currencySymbol: "FCFA",
    locale: "es-GQ",
    defaultTimezone: "Africa/Malabo",
    timezones: [{ value: "Africa/Malabo", label: "Guinea Ecuatorial Time" }],
    phonePrefix: "+240",
    phoneExample: "+240 222 123 456",
    phoneValidation: {
      minDigits: 9,
      maxDigits: 9,
      nationalExample: "222 123 456",
      internationalExample: "+240 222 123 456",
      requiresCountryPrefix: false,
      notes: "Formato base sugerido para teléfonos nacionales.",
    },
    defaultTaxRate: 15,
    taxLabel: "IVA",
    taxMode: "NATIONAL",
    regionalTaxRules: {
      appliesByRegion: false,
      description:
        "Configuración sugerida como impuesto nacional para uso general.",
      notes:
        "Validar reglas fiscales específicas antes de usarlo como cálculo fiscal oficial.",
    },
    identificationTypes: [
      { code: "NIF", label: "NIF", appliesTo: "BOTH" },
      {
        code: "DOCUMENTO_IDENTIDAD",
        label: "Documento de identidad",
        appliesTo: "PERSON",
      },
      { code: "PASSPORT", label: "Pasaporte", appliesTo: "PERSON" },
      {
        code: "BUSINESS_REGISTRATION",
        label: "Registro mercantil",
        appliesTo: "COMPANY",
      },
      { code: "OTHER", label: "Otro", appliesTo: "BOTH" },
    ],
    addressExample:
      "Provincia, distrito, municipio/consejo de poblado, dirección exacta",
    adminLevel1Label: "Provincia",
    adminLevel2Label: "Distrito",
    adminLevel3Label: "Municipio / Consejo de poblado",
    dateFormat: "DD/MM/YYYY",
  },
};
