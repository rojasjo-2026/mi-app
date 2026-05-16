/**
 * Trim seguro con fallback
 */
export function toTrimmedStringOrFallback(
  value: string | null | undefined,
  fallback: string | null
): string | null {
  if (value === undefined) return fallback;
  return value?.trim() || null;
}
