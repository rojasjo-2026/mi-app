import type { CountryPreset } from "./index";

export const NORTH_AMERICA_COUNTRY_PRESETS: Record<string, CountryPreset> = {
  US: {
    countryCode: "US",
    countryName: "United States",
    primaryCurrency: "USD",
    secondaryCurrency: null,
    currencySymbol: "$",
    locale: "en-US",
    defaultTimezone: "America/New_York",
    timezones: [
      { value: "America/New_York", label: "Eastern Time" },
      { value: "America/Chicago", label: "Central Time" },
      { value: "America/Denver", label: "Mountain Time" },
      { value: "America/Phoenix", label: "Arizona Time" },
      { value: "America/Los_Angeles", label: "Pacific Time" },
      { value: "America/Anchorage", label: "Alaska Time" },
      { value: "Pacific/Honolulu", label: "Hawaii Time" },
    ],
    phonePrefix: "+1",
    phoneExample: "+1 555 123 4567",
    phoneValidation: {
      minDigits: 10,
      maxDigits: 10,
      nationalExample: "(555) 123-4567",
      internationalExample: "+1 555 123 4567",
      requiresCountryPrefix: false,
      notes:
        "NANP format. Country prefix can be added for international messaging.",
    },
    defaultTaxRate: 0,
    taxLabel: "Sales Tax",
    taxMode: "REGIONAL",
    regionalTaxRules: {
      appliesByRegion: true,
      description:
        "Sales tax is commonly handled by state, county, city, or local jurisdiction.",
      notes:
        "Keep the default at 0 unless a regional tax rule is configured for the operation.",
    },
    identificationTypes: [
      { code: "SSN", label: "SSN", appliesTo: "PERSON" },
      { code: "EIN", label: "EIN", appliesTo: "COMPANY" },
      { code: "ITIN", label: "ITIN", appliesTo: "PERSON" },
      { code: "PASSPORT", label: "Passport", appliesTo: "PERSON" },
      { code: "OTHER", label: "Other", appliesTo: "BOTH" },
    ],
    addressExample: "State, county/city, ZIP code, street address",
    adminLevel1Label: "State",
    adminLevel2Label: "County / City",
    adminLevel3Label: "ZIP Code / Neighborhood",
    dateFormat: "MM/DD/YYYY",
  },

  CA: {
    countryCode: "CA",
    countryName: "Canada",
    primaryCurrency: "CAD",
    secondaryCurrency: "USD",
    currencySymbol: "C$",
    locale: "en-CA",
    defaultTimezone: "America/Toronto",
    timezones: [
      { value: "America/St_Johns", label: "Newfoundland Time" },
      { value: "America/Halifax", label: "Atlantic Time" },
      { value: "America/Toronto", label: "Eastern Time" },
      { value: "America/Winnipeg", label: "Central Time" },
      { value: "America/Edmonton", label: "Mountain Time" },
      { value: "America/Vancouver", label: "Pacific Time" },
    ],
    phonePrefix: "+1",
    phoneExample: "+1 416 555 1234",
    phoneValidation: {
      minDigits: 10,
      maxDigits: 10,
      nationalExample: "(416) 555-1234",
      internationalExample: "+1 416 555 1234",
      requiresCountryPrefix: false,
      notes:
        "NANP format. Province-based settings may be needed for tax handling.",
    },
    defaultTaxRate: 5,
    taxLabel: "GST / HST",
    taxMode: "MIXED",
    regionalTaxRules: {
      appliesByRegion: true,
      description: "GST/HST/PST handling can vary by province or territory.",
      notes:
        "The 5% value is only a base suggestion. Province-specific rules should override it later.",
    },
    identificationTypes: [
      { code: "SIN", label: "SIN", appliesTo: "PERSON" },
      { code: "BN", label: "Business Number", appliesTo: "COMPANY" },
      { code: "PASSPORT", label: "Passport", appliesTo: "PERSON" },
      { code: "OTHER", label: "Other", appliesTo: "BOTH" },
    ],
    addressExample: "Province/territory, city, postal code, street address",
    adminLevel1Label: "Province / Territory",
    adminLevel2Label: "City / Municipality",
    adminLevel3Label: "Postal Code / Neighborhood",
    dateFormat: "YYYY-MM-DD",
  },
};
