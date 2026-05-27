const DEFAULT_COUNTRY_CODE =
  process.env.DEFAULT_COUNTRY_CODE ||
  process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE ||
  "506";

export function sanitizePhoneNumber(value?: string | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.replace(/[^\d+]/g, "");
}

export function normalizePhoneNumber(
  value?: string | null,
  countryCode = DEFAULT_COUNTRY_CODE,
) {
  const digits = value?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return null;
  }

  if (digits.length === 8 && countryCode) {
    return `${countryCode}${digits}`;
  }

  return digits;
}

export function buildPhoneCandidates(
  ...values: Array<string | null | undefined>
) {
  const candidates = new Set<string>();

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
      DEFAULT_COUNTRY_CODE &&
      digitsOnly.startsWith(DEFAULT_COUNTRY_CODE) &&
      digitsOnly.length > DEFAULT_COUNTRY_CODE.length
    ) {
      const localNumber = digitsOnly.slice(DEFAULT_COUNTRY_CODE.length);

      if (localNumber) {
        candidates.add(localNumber);
        candidates.add(`+${localNumber}`);
      }
    }

    if (
      digitsOnly &&
      DEFAULT_COUNTRY_CODE &&
      digitsOnly.length === 8 &&
      !digitsOnly.startsWith(DEFAULT_COUNTRY_CODE)
    ) {
      candidates.add(`${DEFAULT_COUNTRY_CODE}${digitsOnly}`);
      candidates.add(`+${DEFAULT_COUNTRY_CODE}${digitsOnly}`);
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
