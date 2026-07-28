import type {
  InventoryDocumentLineCodeRecord,
  InventoryDocumentLineCodeSummary,
  InventoryDocumentLineProductRecord,
  InventoryDocumentLineProductSummary,
  InventoryDocumentLineRecord,
  InventoryDocumentLineResponse,
  InventoryDocumentLineUnitRecord,
  InventoryDocumentLineUnitSummary,
  InventoryDocumentLineVariantRecord,
  InventoryDocumentLineVariantSummary,
} from "./inventoryDocumentLine.types";

function mapProduct(
  product: InventoryDocumentLineProductRecord,
): InventoryDocumentLineProductSummary {
  return {
    inventory_product_id: product.inventory_product_id,
    name: product.name,
    product_type: product.product_type,
    tracking_mode: product.tracking_mode,
    manages_stock: product.manages_stock,
    is_active: product.is_active,
  };
}

function mapVariant(
  variant: InventoryDocumentLineVariantRecord,
): InventoryDocumentLineVariantSummary {
  return {
    inventory_product_variant_id: variant.inventory_product_variant_id,
    inventory_product_id: variant.inventory_product_id,
    stock_unit_id: variant.stock_unit_id,
    name: variant.name,
    is_default: variant.is_default,
    is_active: variant.is_active,
    product: mapProduct(variant.product),
  };
}

function mapCode(
  code: InventoryDocumentLineCodeRecord,
): InventoryDocumentLineCodeSummary {
  return {
    inventory_product_code_id: code.inventory_product_code_id,
    inventory_product_variant_id: code.inventory_product_variant_id,
    unit_of_measure_id: code.unit_of_measure_id,
    code: code.code,
    code_type: code.code_type,
    quantity_in_stock_unit: code.quantity_in_stock_unit.toString(),
    is_primary: code.is_primary,
    is_scannable: code.is_scannable,
    is_active: code.is_active,
  };
}

function mapUnit(
  unit: InventoryDocumentLineUnitRecord,
): InventoryDocumentLineUnitSummary {
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

export function mapInventoryDocumentLine(
  line: InventoryDocumentLineRecord,
): InventoryDocumentLineResponse {
  return {
    inventory_document_line_id: line.inventory_document_line_id,
    inventory_document_id: line.inventory_document_id,
    inventory_product_variant_id: line.inventory_product_variant_id,
    inventory_product_code_id: line.inventory_product_code_id,
    unit_of_measure_id: line.unit_of_measure_id,
    line_number: line.line_number,
    quantity: line.quantity.toString(),
    conversion_factor: line.conversion_factor.toString(),
    stock_quantity: line.stock_quantity.toString(),
    received_stock_quantity: line.received_stock_quantity.toString(),
    unit_cost: line.unit_cost.toString(),
    total_cost: line.total_cost.toString(),
    product_name_snapshot: line.product_name_snapshot,
    variant_name_snapshot: line.variant_name_snapshot,
    unit_code_snapshot: line.unit_code_snapshot,
    code_snapshot: line.code_snapshot,
    notes: line.notes,
    variant: mapVariant(line.variant),
    product_code: line.product_code ? mapCode(line.product_code) : null,
    unit_of_measure: mapUnit(line.unit_of_measure),
    created_at: line.created_at.toISOString(),
    updated_at: line.updated_at.toISOString(),
  };
}

export function mapInventoryDocumentLines(
  lines: InventoryDocumentLineRecord[],
): InventoryDocumentLineResponse[] {
  return lines.map(mapInventoryDocumentLine);
}
