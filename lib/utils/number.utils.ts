import { Prisma } from "@prisma/client";

/**
 * Convierte Decimal (Prisma), number o string a number seguro
 */
export function decimalToNumber(
  value: Prisma.Decimal | number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;

  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

/**
 * Convierte input a number con fallback seguro
 */
export function toNumberOrFallback(
  value: number | string | null | undefined,
  fallback: number | null,
): number | null {
  if (value === undefined) return fallback;
  if (value === null || value === "") return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}
