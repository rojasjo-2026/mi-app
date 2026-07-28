import { mapInventoryDocumentLines } from "../document-lines/inventoryDocumentLine.mapper";

import type {
  InventoryDocumentDetailRecord,
  InventoryDocumentDetailResponse,
  InventoryDocumentListRecord,
  InventoryDocumentLocationRecord,
  InventoryDocumentLocationSummary,
  InventoryDocumentResponse,
} from "./inventoryDocument.types";

function mapLocation(
  location: InventoryDocumentLocationRecord,
): InventoryDocumentLocationSummary {
  return {
    inventory_location_id: location.inventory_location_id,
    location_code: location.location_code,
    name: location.name,
    location_type: location.location_type,
    allows_stock: location.allows_stock,
    is_active: location.is_active,
  };
}

function mapOptionalDate(value: Date | null) {
  return value?.toISOString() ?? null;
}

export function mapInventoryDocument(
  document: InventoryDocumentListRecord,
): InventoryDocumentResponse {
  return {
    inventory_document_id: document.inventory_document_id,
    reversal_of_document_id: document.reversal_of_document_id,
    source_location_id: document.source_location_id,
    destination_location_id: document.destination_location_id,
    document_number: document.document_number,
    document_type: document.document_type,
    status: document.status,
    document_date: document.document_date.toISOString(),
    reference_type: document.reference_type,
    reference_id: document.reference_id,
    reference_number: document.reference_number,
    idempotency_key: document.idempotency_key,
    total_cost: document.total_cost.toString(),
    notes: document.notes,
    cancellation_reason: document.cancellation_reason,
    reversal_reason: document.reversal_reason,
    created_by: document.created_by,
    posted_by: document.posted_by,
    received_by: document.received_by,
    cancelled_by: document.cancelled_by,
    reversed_by: document.reversed_by,
    posted_at: mapOptionalDate(document.posted_at),
    received_at: mapOptionalDate(document.received_at),
    cancelled_at: mapOptionalDate(document.cancelled_at),
    reversed_at: mapOptionalDate(document.reversed_at),
    source_location: document.source_location
      ? mapLocation(document.source_location)
      : null,
    destination_location: document.destination_location
      ? mapLocation(document.destination_location)
      : null,
    lines_count: document._count.lines,
    movements_count: document._count.movements,
    created_at: document.created_at.toISOString(),
    updated_at: document.updated_at.toISOString(),
  };
}

export function mapInventoryDocuments(
  documents: InventoryDocumentListRecord[],
): InventoryDocumentResponse[] {
  return documents.map(mapInventoryDocument);
}

export function mapInventoryDocumentDetail(
  document: InventoryDocumentDetailRecord,
): InventoryDocumentDetailResponse {
  return {
    ...mapInventoryDocument(document),
    lines: mapInventoryDocumentLines(document.lines),
  };
}
