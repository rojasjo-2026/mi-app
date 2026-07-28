import { Prisma } from "@prisma/client";

import type {
  InventoryMovementLinkResponse,
  InventoryMovementRecord,
  InventoryMovementResponse,
} from "./inventoryMovement.types";

function toDecimal(value: Prisma.Decimal | string | number) {
  return new Prisma.Decimal(value);
}

function mapMovementLink(
  movement:
    | InventoryMovementRecord["reversal_of_movement"]
    | InventoryMovementRecord["reversal_movement"],
): InventoryMovementLinkResponse | null {
  if (!movement) {
    return null;
  }

  return {
    inventory_movement_id: movement.inventory_movement_id,

    posting_key: movement.posting_key,

    movement_type: movement.movement_type,

    movement_at: movement.movement_at.toISOString(),
  };
}

export function mapInventoryMovement(
  movement: InventoryMovementRecord,
): InventoryMovementResponse {
  const quantityDelta = toDecimal(movement.quantity_delta);

  const unitCost = toDecimal(movement.unit_cost);

  const totalCostDelta = toDecimal(movement.total_cost_delta);

  const zero = new Prisma.Decimal(0);

  const quantityIn = quantityDelta.gt(0) ? quantityDelta : zero;

  const quantityOut = quantityDelta.lt(0) ? quantityDelta.negated() : zero;

  const valueIn = totalCostDelta.gt(0) ? totalCostDelta : zero;

  const valueOut = totalCostDelta.lt(0) ? totalCostDelta.negated() : zero;

  return {
    inventory_movement_id: movement.inventory_movement_id,

    reversal_of_movement_id: movement.reversal_of_movement_id,

    reversal_movement_id:
      movement.reversal_movement?.inventory_movement_id ?? null,

    inventory_document_id: movement.inventory_document_id,

    inventory_document_line_id: movement.inventory_document_line_id,

    inventory_product_variant_id: movement.inventory_product_variant_id,

    inventory_location_id: movement.inventory_location_id,

    posting_key: movement.posting_key,

    movement_type: movement.movement_type,

    quantity_delta: quantityDelta.toString(),

    quantity_in: quantityIn.toString(),

    quantity_out: quantityOut.toString(),

    unit_cost: unitCost.toString(),

    total_cost_delta: totalCostDelta.toString(),

    value_in: valueIn.toString(),

    value_out: valueOut.toString(),

    movement_at: movement.movement_at.toISOString(),

    notes: movement.notes,

    created_by: movement.created_by,

    created_at: movement.created_at.toISOString(),

    document: {
      inventory_document_id: movement.document.inventory_document_id,

      reversal_of_document_id: movement.document.reversal_of_document_id,

      document_number: movement.document.document_number,

      document_type: movement.document.document_type,

      status: movement.document.status,

      document_date: movement.document.document_date.toISOString(),

      reference_number: movement.document.reference_number,
    },

    document_line: {
      inventory_document_line_id:
        movement.document_line.inventory_document_line_id,

      line_number: movement.document_line.line_number,
    },

    product: {
      inventory_product_id: movement.variant.product.inventory_product_id,

      name: movement.variant.product.name,

      product_type: movement.variant.product.product_type,

      tracking_mode: movement.variant.product.tracking_mode,

      manages_stock: movement.variant.product.manages_stock,

      allow_negative_stock: movement.variant.product.allow_negative_stock,

      is_active: movement.variant.product.is_active,
    },

    variant: {
      inventory_product_variant_id:
        movement.variant.inventory_product_variant_id,

      inventory_product_id: movement.variant.inventory_product_id,

      stock_unit_id: movement.variant.stock_unit_id,

      name: movement.variant.name,

      is_default: movement.variant.is_default,

      is_active: movement.variant.is_active,
    },

    stock_unit: {
      unit_of_measure_id: movement.variant.stock_unit.unit_of_measure_id,

      code: movement.variant.stock_unit.code,

      name: movement.variant.stock_unit.name,

      symbol: movement.variant.stock_unit.symbol,

      allows_decimal: movement.variant.stock_unit.allows_decimal,

      decimal_scale: movement.variant.stock_unit.decimal_scale,

      is_active: movement.variant.stock_unit.is_active,
    },

    location: {
      inventory_location_id: movement.location.inventory_location_id,

      location_code: movement.location.location_code,

      name: movement.location.name,

      location_type: movement.location.location_type,

      allows_stock: movement.location.allows_stock,

      is_active: movement.location.is_active,
    },

    reversal_of_movement: mapMovementLink(movement.reversal_of_movement),

    reversal_movement: mapMovementLink(movement.reversal_movement),
  };
}

export function mapInventoryMovements(movements: InventoryMovementRecord[]) {
  return movements.map(mapInventoryMovement);
}
