import { isCostaRicaCountry } from "@/lib/config/country-features";

export type ClientType = "PERSON" | "COMPANY" | "OTHER";

export type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function normalizeIdentifier(value: unknown): string | null {
  const textValue = toTrimmedString(value);

  if (!textValue) {
    return null;
  }

  return textValue.replace(/[\s-]/g, "") || null;
}

export function toDateOrNull(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function normalizeClientType(value: unknown): ClientType {
  const textValue = toTrimmedString(value)?.toUpperCase();

  if (textValue === "COMPANY" || textValue === "OTHER") {
    return textValue;
  }

  return "PERSON";
}

export function normalizeComplianceProfile(
  value: unknown,
  countryCode: string,
): ClientComplianceProfile {
  const textValue = toTrimmedString(value)?.toUpperCase();

  if (textValue === "GLOBAL" || textValue === "COSTA_RICA") {
    return textValue;
  }

  return isCostaRicaCountry(countryCode) ? "COSTA_RICA" : "GLOBAL";
}
