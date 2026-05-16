/**
 * Convierte string a Date seguro
 */
export function toDateOrFallback(
  value: string | null | undefined,
  fallback: Date | null
): Date | null {
  if (value === undefined) return fallback;
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}
