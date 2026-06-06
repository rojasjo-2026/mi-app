import {
  COUNTRY_PRESETS,
  getCountryPreset,
  type CountryPreset,
} from "@/lib/settings/countryPresets";

export type { CountryPreset };

export type GooglePlaceAutocompleteResult = {
  formatted_address?: string;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
};

export type GooglePlaceAutocomplete = {
  addListener: (eventName: "place_changed", callback: () => void) => void;
  getPlace: () => GooglePlaceAutocompleteResult;
};

export type GoogleMapsBrowserApi = {
  maps?: {
    places?: {
      Autocomplete: new (
        input: HTMLInputElement,
        options: {
          componentRestrictions?: { country: string };
          fields: string[];
        },
      ) => GooglePlaceAutocomplete;
    };
  };
};

export type SpeechRecognitionAlternativeLike = {
  transcript?: string;
};

export type SpeechRecognitionResultLike = {
  [index: number]: SpeechRecognitionAlternativeLike | undefined;
};

export type SpeechRecognitionResultListLike = {
  [index: number]: SpeechRecognitionResultLike | undefined;
};

export type SpeechRecognitionResultEventLike = {
  results: SpeechRecognitionResultListLike;
};

export type SpeechRecognitionErrorEventLike = {
  error?: string;
};

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export type BrowserWindowWithGoogle = Window & {
  google?: GoogleMapsBrowserApi;
};

export type BrowserWindowWithSpeech = Window & {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
};

export type Client = {
  client_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  phone_primary?: string | null;
  phone_secondary?: string | null;
  address_line?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  zone?: string | null;
  operational_zone_id?: string | null;
  reference_point?: string | null;
  location_notes?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export type NominatimResponse = {
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state_district?: string;
    state?: string;
    municipality?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    hamlet?: string;
  };
};

export type AppSettingsResponse = {
  success: boolean;
  data?: {
    country_code?: string | null;
    default_currency?: string | null;
  } | null;
};

export const MAX_NOTES_LENGTH = 300;
export const DEFAULT_COUNTRY_CODE = "CR";

export const fallbackCountryPreset =
  getCountryPreset(DEFAULT_COUNTRY_CODE) ?? Object.values(COUNTRY_PRESETS)[0];

