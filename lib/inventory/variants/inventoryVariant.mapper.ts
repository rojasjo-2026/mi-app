import type {
  InventoryVariantCodeRecord,
  InventoryVariantCodeSummary,
  InventoryVariantDetailRecord,
  InventoryVariantDetailResponse,
  InventoryVariantListRecord,
  InventoryVariantResponse,
  InventoryVariantSummary,
  InventoryVariantUnitRecord,
  InventoryVariantUnitSummary,
} from "./inventoryVariant.types";

export function mapInventoryVariantUnit(
  unit: InventoryVariantUnitRecord,
): InventoryVariantUnitSummary {
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

function mapInventoryVariantCode(
  code: InventoryVariantCodeRecord,
): InventoryVariantCodeSummary {
  return {
    inventory_product_code_id: code.inventory_product_code_id,
    code: code.code,
    code_type: code.code_type,
    label: code.label,
    is_primary: code.is_primary,
    is_scannable: code.is_scannable,
    is_active: code.is_active,
  };
}

export function mapInventoryVariantSummary(variant: {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  stock_unit: InventoryVariantUnitRecord;
}): InventoryVariantSummary {
  return {
    inventory_product_variant_id: variant.inventory_product_variant_id,
    inventory_product_id: variant.inventory_product_id,
    stock_unit_id: variant.stock_unit_id,
    name: variant.name,
    is_default: variant.is_default,
    sort_order: variant.sort_order,
    is_active: variant.is_active,
    stock_unit: mapInventoryVariantUnit(variant.stock_unit),
  };
}

export function mapInventoryVariant(
  variant: InventoryVariantListRecord,
): InventoryVariantResponse {
  return {
    inventory_product_variant_id: variant.inventory_product_variant_id,
    inventory_product_id: variant.inventory_product_id,
    stock_unit_id: variant.stock_unit_id,
    name: variant.name,
    attributes: variant.attributes,
    default_cost: variant.default_cost?.toString() ?? null,
    default_price: variant.default_price?.toString() ?? null,
    minimum_stock: variant.minimum_stock.toString(),
    maximum_stock: variant.maximum_stock?.toString() ?? null,
    is_default: variant.is_default,
    sort_order: variant.sort_order,
    is_active: variant.is_active,
    stock_unit: mapInventoryVariantUnit(variant.stock_unit),
    codes_count: variant._count.codes,
    stock_balances_count: variant._count.stock_balances,
    created_at: variant.created_at.toISOString(),
    updated_at: variant.updated_at.toISOString(),
  };
}

export function mapInventoryVariants(
  variants: InventoryVariantListRecord[],
): InventoryVariantResponse[] {
  return variants.map(mapInventoryVariant);
}

export function mapInventoryVariantDetail(
  variant: InventoryVariantDetailRecord,
): InventoryVariantDetailResponse {
  return {
    ...mapInventoryVariant(variant),
    codes: variant.codes.map(mapInventoryVariantCode),
  };
}
