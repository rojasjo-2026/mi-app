import { Prisma } from "@prisma/client";

import type {
  InventoryStockBalanceRecord,
  InventoryStockBalanceResponse,
} from "./inventoryStockBalance.types";

function toDecimal(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

export function mapInventoryStockBalance(
  balance: InventoryStockBalanceRecord,
): InventoryStockBalanceResponse {
  const quantityOnHand = toDecimal(balance.quantity_on_hand);

  const quantityReserved = toDecimal(balance.quantity_reserved);

  const averageUnitCost = toDecimal(balance.average_unit_cost);

  const availableQuantity = quantityOnHand.minus(quantityReserved);

  const inventoryValue = quantityOnHand
    .times(averageUnitCost)
    .toDecimalPlaces(4);

  return {
    inventory_stock_balance_id: balance.inventory_stock_balance_id,

    inventory_product_variant_id: balance.inventory_product_variant_id,

    inventory_location_id: balance.inventory_location_id,

    quantity_on_hand: quantityOnHand.toString(),

    quantity_reserved: quantityReserved.toString(),

    available_quantity: availableQuantity.toString(),

    average_unit_cost: averageUnitCost.toString(),

    inventory_value: inventoryValue.toString(),

    version: balance.version,

    product: {
      inventory_product_id: balance.variant.product.inventory_product_id,

      name: balance.variant.product.name,

      product_type: balance.variant.product.product_type,

      tracking_mode: balance.variant.product.tracking_mode,

      manages_stock: balance.variant.product.manages_stock,

      allow_negative_stock: balance.variant.product.allow_negative_stock,

      is_active: balance.variant.product.is_active,
    },

    variant: {
      inventory_product_variant_id:
        balance.variant.inventory_product_variant_id,

      inventory_product_id: balance.variant.inventory_product_id,

      stock_unit_id: balance.variant.stock_unit_id,

      name: balance.variant.name,

      is_default: balance.variant.is_default,

      is_active: balance.variant.is_active,
    },

    stock_unit: {
      unit_of_measure_id: balance.variant.stock_unit.unit_of_measure_id,

      code: balance.variant.stock_unit.code,

      name: balance.variant.stock_unit.name,

      symbol: balance.variant.stock_unit.symbol,

      allows_decimal: balance.variant.stock_unit.allows_decimal,

      decimal_scale: balance.variant.stock_unit.decimal_scale,

      is_active: balance.variant.stock_unit.is_active,
    },

    location: {
      inventory_location_id: balance.location.inventory_location_id,

      location_code: balance.location.location_code,

      name: balance.location.name,

      location_type: balance.location.location_type,

      allows_stock: balance.location.allows_stock,

      is_active: balance.location.is_active,
    },

    created_at: balance.created_at.toISOString(),

    updated_at: balance.updated_at.toISOString(),
  };
}

export function mapInventoryStockBalances(
  balances: InventoryStockBalanceRecord[],
) {
  return balances.map(mapInventoryStockBalance);
}
