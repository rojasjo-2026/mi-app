import type { UnitOfMeasure } from "@prisma/client";

import type { UnitOfMeasureResponse } from "./unitOfMeasure.types";

export function mapUnitOfMeasure(unit: UnitOfMeasure): UnitOfMeasureResponse {
  return {
    unit_of_measure_id: unit.unit_of_measure_id,
    code: unit.code,
    name: unit.name,
    symbol: unit.symbol,
    allows_decimal: unit.allows_decimal,
    decimal_scale: unit.decimal_scale,
    is_active: unit.is_active,
    created_at: unit.created_at.toISOString(),
    updated_at: unit.updated_at.toISOString(),
  };
}

export function mapUnitOfMeasures(
  units: UnitOfMeasure[],
): UnitOfMeasureResponse[] {
  return units.map(mapUnitOfMeasure);
}
