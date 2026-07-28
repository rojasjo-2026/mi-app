import type {
  InventoryReservationDetailRecord,
  InventoryReservationDetailResponse,
  InventoryReservationEventResponse,
  InventoryReservationLineRecord,
  InventoryReservationLineResponse,
  InventoryReservationLocationRecord,
  InventoryReservationLocationSummary,
  InventoryReservationProductRecord,
  InventoryReservationProductSummary,
  InventoryReservationVariantRecord,
  InventoryReservationVariantSummary,
} from "./inventoryReservation.types";

function mapOptionalDate(value: Date | null) {
  return value?.toISOString() ?? null;
}

function mapProduct(
  product: InventoryReservationProductRecord,
): InventoryReservationProductSummary {
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
  variant: InventoryReservationVariantRecord,
): InventoryReservationVariantSummary {
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

function mapLocation(
  location: InventoryReservationLocationRecord,
): InventoryReservationLocationSummary {
  return {
    inventory_location_id: location.inventory_location_id,
    location_code: location.location_code,
    name: location.name,
    location_type: location.location_type,
    allows_stock: location.allows_stock,
    is_active: location.is_active,
  };
}

function mapReservationLine(
  line: InventoryReservationLineRecord,
): InventoryReservationLineResponse {
  return {
    inventory_reservation_line_id: line.inventory_reservation_line_id,
    inventory_reservation_id: line.inventory_reservation_id,
    inventory_product_variant_id: line.inventory_product_variant_id,
    inventory_location_id: line.inventory_location_id,
    line_number: line.line_number,
    quantity_requested: line.quantity_requested.toString(),
    quantity_reserved: line.quantity_reserved.toString(),
    quantity_consumed: line.quantity_consumed.toString(),
    quantity_released: line.quantity_released.toString(),
    notes: line.notes,
    variant: mapVariant(line.variant),
    location: mapLocation(line.location),
    created_at: line.created_at.toISOString(),
    updated_at: line.updated_at.toISOString(),
  };
}

function mapReservationEvent(
  event: InventoryReservationDetailRecord["events"][number],
): InventoryReservationEventResponse {
  return {
    inventory_reservation_event_id: event.inventory_reservation_event_id,
    inventory_reservation_id: event.inventory_reservation_id,
    inventory_reservation_line_id: event.inventory_reservation_line_id,
    event_type: event.event_type,
    previous_status: event.previous_status,
    new_status: event.new_status,
    quantity: event.quantity?.toString() ?? null,
    reference_type: event.reference_type,
    reference_id: event.reference_id,
    reference_number: event.reference_number,
    reason: event.reason,
    metadata: event.metadata,
    created_by: event.created_by,
    created_at: event.created_at.toISOString(),
  };
}

export function mapInventoryReservationDetail(
  reservation: InventoryReservationDetailRecord,
): InventoryReservationDetailResponse {
  return {
    inventory_reservation_id: reservation.inventory_reservation_id,
    reservation_number: reservation.reservation_number,
    status: reservation.status,
    reference_type: reservation.reference_type,
    reference_id: reservation.reference_id,
    reference_number: reservation.reference_number,
    idempotency_key: reservation.idempotency_key,
    expires_at: mapOptionalDate(reservation.expires_at),
    notes: reservation.notes,
    created_by: reservation.created_by,
    activated_by: reservation.activated_by,
    released_by: reservation.released_by,
    expired_by: reservation.expired_by,
    cancelled_by: reservation.cancelled_by,
    activated_at: mapOptionalDate(reservation.activated_at),
    consumed_at: mapOptionalDate(reservation.consumed_at),
    released_at: mapOptionalDate(reservation.released_at),
    expired_at: mapOptionalDate(reservation.expired_at),
    cancelled_at: mapOptionalDate(reservation.cancelled_at),
    created_at: reservation.created_at.toISOString(),
    updated_at: reservation.updated_at.toISOString(),
    lines: reservation.lines.map(mapReservationLine),
    events: reservation.events.map(mapReservationEvent),
  };
}
