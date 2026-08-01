import type { InventoryUnitOfMeasure } from "../types";

export function sortInventoryUnits(units: InventoryUnitOfMeasure[]) {
  return [...units].sort((first, second) => {
    const nameComparison = first.name.localeCompare(second.name, "es", {
      sensitivity: "base",
    });

    if (nameComparison !== 0) {
      return nameComparison;
    }

    return first.code.localeCompare(second.code, "es", {
      sensitivity: "base",
    });
  });
}

export function formatInventoryUnitDateTime(
  value: string | null | undefined,
  locale: string,
) {
  if (!value) {
    return "No registrado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No registrado";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getInventoryUnitStatusLabel(unit: InventoryUnitOfMeasure) {
  return unit.is_active ? "Activa" : "Inactiva";
}

export function getInventoryUnitStatusClass(unit: InventoryUnitOfMeasure) {
  return unit.is_active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-500";
}

export function getInventoryUnitSymbolLabel(unit: InventoryUnitOfMeasure) {
  return unit.symbol || "Sin símbolo";
}

export function getInventoryUnitQuantityTypeLabel(
  unit: InventoryUnitOfMeasure,
) {
  return unit.allows_decimal ? "Permite decimales" : "Solo cantidades enteras";
}

export function getInventoryUnitPrecisionLabel(unit: InventoryUnitOfMeasure) {
  if (!unit.allows_decimal) {
    return "Sin decimales";
  }

  return unit.decimal_scale === 1
    ? "1 decimal"
    : `${unit.decimal_scale} decimales`;
}

export function getInventoryUnitExample(unit: InventoryUnitOfMeasure) {
  if (!unit.allows_decimal) {
    return unit.symbol ? `1 ${unit.symbol}` : "1";
  }

  const exampleValue = (1 + 1 / 10 ** unit.decimal_scale).toFixed(
    unit.decimal_scale,
  );

  return unit.symbol ? `${exampleValue} ${unit.symbol}` : exampleValue;
}
