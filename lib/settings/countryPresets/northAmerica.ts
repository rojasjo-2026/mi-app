import type { CountryPreset } from "./index";

export const NORTH_AMERICA_COUNTRY_PRESETS: Record<string, CountryPreset> = {
  US: {
    countryCode: "US",
    countryName: "United States",
    primaryCurrency: "USD",
    secondaryCurrency: null,
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
    defaultTaxRate: 0,
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
    defaultTaxRate: 5,
    adminLevel1Label: "Province / Territory",
    adminLevel2Label: "City / Municipality",
    adminLevel3Label: "Postal Code / Neighborhood",
    dateFormat: "YYYY-MM-DD",
  },
};
