import { InventoryReservationStatus, Prisma } from "@prisma/client";

import { mapInventoryReservationDetail } from "./inventoryReservation.mapper";

import type { InventoryReservationDetailRecord } from "./inventoryReservation.types";

import type {
  InventoryReservationConsumptionDocumentRecord,
  InventoryReservationListRecord,
} from "./inventoryReservationQuery.repository";

import type {
  InventoryReservationActionAvailability,
  InventoryReservationConsumptionDocumentResponse,
  InventoryReservationExpirationSummary,
  InventoryReservationListItemResponse,
  InventoryReservationManagementDetailResponse,
  InventoryReservationQuantityTotals,
} from "./inventoryReservationQuery.types";

const MILLISECONDS_PER_DAY = 86_400_000;

const operationalStatuses: InventoryReservationStatus[] = [
  InventoryReservationStatus.DRAFT,
  InventoryReservationStatus.ACTIVE,
  InventoryReservationStatus.PARTIALLY_CONSUMED,
];

function calculateQuantityTotals(
  lines: Array<{
    quantity_requested: Prisma.Decimal;
    quantity_reserved: Prisma.Decimal;
    quantity_consumed: Prisma.Decimal;
    quantity_released: Prisma.Decimal;
  }>,
): InventoryReservationQuantityTotals {
  const totals = lines.reduce(
    (current, line) => ({
      requested: current.requested.plus(line.quantity_requested),

      reserved: current.reserved.plus(line.quantity_reserved),

      consumed: current.consumed.plus(line.quantity_consumed),

      released: current.released.plus(line.quantity_released),
    }),
    {
      requested: new Prisma.Decimal(0),

      reserved: new Prisma.Decimal(0),

      consumed: new Prisma.Decimal(0),

      released: new Prisma.Decimal(0),
    },
  );

  return {
    requested: totals.requested.toString(),

    reserved: totals.reserved.toString(),

    consumed: totals.consumed.toString(),

    released: totals.released.toString(),
  };
}

function calculateExpirationSummary(
  status: InventoryReservationStatus,
  expiresAt: Date | null,
  asOf: Date,
  expiringWithinDays: number,
): InventoryReservationExpirationSummary {
  if (!expiresAt) {
    return {
      has_expiration: false,
      is_overdue: false,
      is_expiring_soon: false,
      days_until_expiration: null,
    };
  }

  const difference = expiresAt.getTime() - asOf.getTime();

  const operational = operationalStatuses.includes(status);

  const isOverdue = operational && difference <= 0;

  const upcomingLimit = expiringWithinDays * MILLISECONDS_PER_DAY;

  const isExpiringSoon =
    operational && difference > 0 && difference <= upcomingLimit;

  const daysUntilExpiration =
    difference >= 0
      ? Math.ceil(difference / MILLISECONDS_PER_DAY)
      : Math.floor(difference / MILLISECONDS_PER_DAY);

  return {
    has_expiration: true,
    is_overdue: isOverdue,
    is_expiring_soon: isExpiringSoon,
    days_until_expiration: daysUntilExpiration,
  };
}

function calculateActions(
  status: InventoryReservationStatus,
  expiration: InventoryReservationExpirationSummary,
): InventoryReservationActionAvailability {
  const isDraft = status === InventoryReservationStatus.DRAFT;

  const isActive =
    status === InventoryReservationStatus.ACTIVE ||
    status === InventoryReservationStatus.PARTIALLY_CONSUMED;

  return {
    can_activate: isDraft && !expiration.is_overdue,

    can_consume: isActive && !expiration.is_overdue,

    can_release: isActive,

    can_expire: isActive && expiration.is_overdue,

    can_cancel: isDraft,
  };
}

function mapProducts(reservation: InventoryReservationListRecord) {
  const products = new Map<
    string,
    InventoryReservationListItemResponse["products"][number]
  >();

  for (const line of reservation.lines) {
    products.set(line.inventory_product_variant_id, {
      inventory_product_id: line.variant.product.inventory_product_id,

      product_name: line.variant.product.name,

      inventory_product_variant_id: line.variant.inventory_product_variant_id,

      variant_name: line.variant.name,
    });
  }

  return Array.from(products.values());
}

function mapLocations(reservation: InventoryReservationListRecord) {
  const locations = new Map<
    string,
    InventoryReservationListItemResponse["locations"][number]
  >();

  for (const line of reservation.lines) {
    locations.set(line.inventory_location_id, {
      inventory_location_id: line.location.inventory_location_id,

      location_code: line.location.location_code,

      location_name: line.location.name,
    });
  }

  return Array.from(locations.values());
}

export function mapInventoryReservationListItem(
  reservation: InventoryReservationListRecord,
  asOf: Date,
  expiringWithinDays: number,
): InventoryReservationListItemResponse {
  const expiration = calculateExpirationSummary(
    reservation.status,
    reservation.expires_at,
    asOf,
    expiringWithinDays,
  );

  const products = mapProducts(reservation);

  const locations = mapLocations(reservation);

  return {
    inventory_reservation_id: reservation.inventory_reservation_id,

    reservation_number: reservation.reservation_number,

    status: reservation.status,

    reference_type: reservation.reference_type,

    reference_id: reservation.reference_id,

    reference_number: reservation.reference_number,

    expires_at: reservation.expires_at?.toISOString() ?? null,

    notes: reservation.notes,

    created_by: reservation.created_by,

    created_at: reservation.created_at.toISOString(),

    updated_at: reservation.updated_at.toISOString(),

    line_count: reservation.lines.length,

    event_count: reservation._count.events,

    product_count: products.length,

    location_count: locations.length,

    quantity_totals: calculateQuantityTotals(reservation.lines),

    expiration,

    actions: calculateActions(reservation.status, expiration),

    products,
    locations,
  };
}

export function mapInventoryReservationList(
  reservations: InventoryReservationListRecord[],
  asOf: Date,
  expiringWithinDays: number,
) {
  return reservations.map((reservation) =>
    mapInventoryReservationListItem(reservation, asOf, expiringWithinDays),
  );
}

function mapConsumptionDocument(
  document: InventoryReservationConsumptionDocumentRecord,
): InventoryReservationConsumptionDocumentResponse {
  return {
    inventory_document_id: document.inventory_document_id,

    document_number: document.document_number,

    document_type: document.document_type,

    status: document.status,

    document_date: document.document_date.toISOString(),

    total_cost: document.total_cost.toString(),

    posted_by: document.posted_by,

    posted_at: document.posted_at?.toISOString() ?? null,

    created_at: document.created_at.toISOString(),

    lines_count: document._count.lines,

    movements_count: document._count.movements,
  };
}

export function mapInventoryReservationManagementDetail(
  reservation: InventoryReservationDetailRecord,
  documents: InventoryReservationConsumptionDocumentRecord[],
  asOf: Date,
  expiringWithinDays: number,
): InventoryReservationManagementDetailResponse {
  const expiration = calculateExpirationSummary(
    reservation.status,
    reservation.expires_at,
    asOf,
    expiringWithinDays,
  );

  return {
    ...mapInventoryReservationDetail(reservation),

    quantity_totals: calculateQuantityTotals(reservation.lines),

    expiration,

    actions: calculateActions(reservation.status, expiration),

    related_consumption_documents: documents.map(mapConsumptionDocument),
  };
}
