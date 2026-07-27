import type {
  InventoryCodeListRecord,
  InventoryCodeResponse,
  InventoryCodeUnitRecord,
  InventoryCodeUnitSummary,
} from "./inventoryCode.types";

function mapInventoryCodeUnit(
  unit: InventoryCodeUnitRecord,
): InventoryCodeUnitSummary {
  return {
    unit_of_measure_id: unit.unit_of_measure_id,
    code: unit.code,
    name: unit.name,
    symbol: unit.symbol,
    allows_decimal: unit.allows_decimal,
    decimal_scale: unit.decimal_scale,
    is_active: unit.is_active,
  };
}

export function mapInventoryCode(
  code: InventoryCodeListRecord,
): InventoryCodeResponse {
  return {
    inventory_product_code_id: code.inventory_product_code_id,
    inventory_product_variant_id: code.inventory_product_variant_id,
    unit_of_measure_id: code.unit_of_measure_id,
    code: code.code,
    code_type: code.code_type,
    label: code.label,
    quantity_in_stock_unit: code.quantity_in_stock_unit.toString(),
    is_primary: code.is_primary,
    is_scannable: code.is_scannable,
    is_active: code.is_active,
    unit_of_measure: code.unit_of_measure
      ? mapInventoryCodeUnit(code.unit_of_measure)
      : null,
    created_at: code.created_at.toISOString(),
    updated_at: code.updated_at.toISOString(),
  };
}

export function mapInventoryCodes(
  codes: InventoryCodeListRecord[],
): InventoryCodeResponse[] {
  return codes.map(mapInventoryCode);
}
