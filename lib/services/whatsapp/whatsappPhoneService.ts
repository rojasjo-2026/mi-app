import { resolveAppSettings } from "@/lib/config/app-settings";

const DEFAULT_PHONE_COUNTRY_CODE = resolveDefaultPhoneCountryCode();

function resolveDefaultPhoneCountryCode() {
  const configuredPhoneCountryCode =
    process.env.DEFAULT_PHONE_COUNTRY_CODE ||
    process.env.NEXT_PUBLIC_DEFAULT_PHONE_COUNTRY_CODE;

  if (configuredPhoneCountryCode) {
    return configuredPhoneCountryCode.replace(/\D/g, "");
  }

  const configuredCountryCode =
    process.env.DEFAULT_COUNTRY_CODE ||
    process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE;

  const resolvedSettings = resolveAppSettings(
    configuredCountryCode
      ? {
          country_code: configuredCountryCode,
        }
      : undefined,
  );

  return String(resolvedSettings.phoneCountryCode || "").replace(/\D/g, "");
}

function normalizePhoneCountryCode(value?: string | null) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    return DEFAULT_PHONE_COUNTRY_CODE;
  }

  const digitsOnly = cleanValue.replace(/\D/g, "");

  if (digitsOnly) {
    return digitsOnly;
  }

  const resolvedSettings = resolveAppSettings({
    country_code: cleanValue,
  });

  return (
    String(resolvedSettings.phoneCountryCode || "").replace(/\D/g, "") ||
    DEFAULT_PHONE_COUNTRY_CODE
  );
}

export function sanitizePhoneNumber(value?: string | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.replace(/[^\d+]/g, "");
}

export function normalizePhoneNumber(
  value?: string | null,
  phoneCountryCode = DEFAULT_PHONE_COUNTRY_CODE,
) {
  const digits = value?.replace(/\D/g, "") ?? "";
  const normalizedPhoneCountryCode =
    normalizePhoneCountryCode(phoneCountryCode);

  if (!digits) {
    return null;
  }

  if (digits.length === 8 && normalizedPhoneCountryCode) {
    return `${normalizedPhoneCountryCode}${digits}`;
  }

  return digits;
}

export function buildPhoneCandidates(
  ...values: Array<string | null | undefined>
) {
  return buildPhoneCandidatesWithPhoneCountryCode(
    DEFAULT_PHONE_COUNTRY_CODE,
    ...values,
  );
}

export function buildPhoneCandidatesWithPhoneCountryCode(
  phoneCountryCode: string | null | undefined,
  ...values: Array<string | null | undefined>
) {
  const candidates = new Set<string>();
  const normalizedPhoneCountryCode =
    normalizePhoneCountryCode(phoneCountryCode);

  for (const value of values) {
    const sanitizedValue = sanitizePhoneNumber(value);
    const digitsOnly = sanitizedValue?.replace(/\D/g, "") ?? "";

    if (sanitizedValue) {
      candidates.add(sanitizedValue);
    }

    if (digitsOnly) {
      candidates.add(digitsOnly);
      candidates.add(`+${digitsOnly}`);
    }

    if (
      digitsOnly &&
      normalizedPhoneCountryCode &&
      digitsOnly.startsWith(normalizedPhoneCountryCode) &&
      digitsOnly.length > normalizedPhoneCountryCode.length
    ) {
      const localNumber = digitsOnly.slice(normalizedPhoneCountryCode.length);

      if (localNumber) {
        candidates.add(localNumber);
        candidates.add(`+${localNumber}`);
      }
    }

    if (
      digitsOnly &&
      normalizedPhoneCountryCode &&
      digitsOnly.length === 8 &&
      !digitsOnly.startsWith(normalizedPhoneCountryCode)
    ) {
      candidates.add(`${normalizedPhoneCountryCode}${digitsOnly}`);
      candidates.add(`+${normalizedPhoneCountryCode}${digitsOnly}`);
    }
  }

  return Array.from(candidates).filter(Boolean);
}

export function parseUnixTimestamp(timestamp?: string | null) {
  if (!timestamp) {
    return new Date();
  }

  const parsedTimestamp = Number(timestamp);

  if (!Number.isFinite(parsedTimestamp)) {
    return new Date();
  }

  return new Date(parsedTimestamp * 1000);
}
