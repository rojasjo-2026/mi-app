import { Prisma } from "@prisma/client";

import type {
  InventoryStockBalanceRecord,
  InventoryStockBalanceResponse,
  InventoryStockLocationRecord,
  InventoryStockLocationSummary,
  InventoryStockProductRecord,
  InventoryStockProductSummary,
  InventoryStockUnitRecord,
  InventoryStockUnitSummary,
  InventoryStockVariantRecord,
  InventoryStockVariantSummary,
} from "./inventoryStockBalance.types";

function mapInventoryStockProduct(
  product: InventoryStockProductRecord,
): InventoryStockProductSummary {
  return {
    inventory_product_id: product.inventory_product_id,
    name: product.name,
    brand: product.brand,
    model: product.model,
    product_type: product.product_type,
    tracking_mode: product.tracking_mode,
    manages_stock: product.manages_stock,
    allow_negative_stock: product.allow_negative_stock,
    is_active: product.is_active,
  };
}

function mapInventoryStockUnit(
  unit: InventoryStockUnitRecord,
): InventoryStockUnitSummary {
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

function mapInventoryStockVariant(
  variant: InventoryStockVariantRecord,
): InventoryStockVariantSummary {
  return {
    inventory_product_variant_id: variant.inventory_product_variant_id,
    inventory_product_id: variant.inventory_product_id,
    stock_unit_id: variant.stock_unit_id,
    name: variant.name,
    minimum_stock: variant.minimum_stock.toString(),
    maximum_stock: variant.maximum_stock?.toString() ?? null,
    is_default: variant.is_default,
    is_active: variant.is_active,
    product: mapInventoryStockProduct(variant.product),
    stock_unit: mapInventoryStockUnit(variant.stock_unit),
  };
}

function mapInventoryStockLocation(
  location: InventoryStockLocationRecord,
): InventoryStockLocationSummary {
  return {
    inventory_location_id: location.inventory_location_id,
    parent_location_id: location.parent_location_id,
    location_code: location.location_code,
    name: location.name,
    location_type: location.location_type,
    allows_stock: location.allows_stock,
    is_default: location.is_default,
    is_active: location.is_active,
  };
}

export function mapInventoryStockBalance(
  balance: InventoryStockBalanceRecord,
): InventoryStockBalanceResponse {
  const quantityAvailable = balance.quantity_on_hand.minus(
    balance.quantity_reserved,
  );

  const inventoryValue = balance.quantity_on_hand.mul(
    balance.average_unit_cost,
  );

  return {
    inventory_stock_balance_id: balance.inventory_stock_balance_id,
    inventory_product_variant_id: balance.inventory_product_variant_id,
    inventory_location_id: balance.inventory_location_id,
    quantity_on_hand: balance.quantity_on_hand.toString(),
    quantity_reserved: balance.quantity_reserved.toString(),
    quantity_available: quantityAvailable.toString(),
    average_unit_cost: balance.average_unit_cost.toString(),
    inventory_value: new Prisma.Decimal(inventoryValue).toString(),
    version: balance.version,
    variant: mapInventoryStockVariant(balance.variant),
    location: mapInventoryStockLocation(balance.location),
    created_at: balance.created_at.toISOString(),
    updated_at: balance.updated_at.toISOString(),
  };
}

export function mapInventoryStockBalances(
  balances: InventoryStockBalanceRecord[],
): InventoryStockBalanceResponse[] {
  return balances.map(mapInventoryStockBalance);
}
