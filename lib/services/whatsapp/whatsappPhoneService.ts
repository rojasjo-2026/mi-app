export function sanitizePhoneNumber(value?: string | null): string | null {
  if (!value) return null;

  const cleaned = value.replace(/\D/g, "");
  return cleaned || null;
}

export function normalizePhoneNumber(
  value?: string | null,
  phoneCountryCode?: string | null,
): string | null {
  const cleaned = sanitizePhoneNumber(value);
  const cleanedCountryCode = sanitizePhoneNumber(phoneCountryCode);

  if (!cleaned) return null;

  if (!cleanedCountryCode) {
    return cleaned;
  }

  if (cleaned.startsWith(cleanedCountryCode)) {
    return cleaned;
  }

  return `${cleanedCountryCode}${cleaned}`;
}

export function buildPhoneCandidates(
  rawFrom: string | null,
  normalizedFrom: string | null,
): string[] {
  const values = [rawFrom, normalizedFrom].filter((value): value is string =>
    Boolean(value),
  );

  return [...new Set(values)];
}

export function parseUnixTimestamp(value?: string): Date {
  if (!value) return new Date();

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return new Date();
  }

  return new Date(numericValue * 1000);
}
