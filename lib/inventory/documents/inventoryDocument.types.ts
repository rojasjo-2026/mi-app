import type {
  InventoryDocument,
  InventoryDocumentStatus,
  InventoryDocumentType,
  InventoryLocationType,
} from "@prisma/client";

import type {
  InventoryDocumentLineRecord,
  InventoryDocumentLineResponse,
} from "../document-lines/inventoryDocumentLine.types";

export type InventoryDocumentFilters = {
  search?: string;
  documentType?: InventoryDocumentType;
  status?: InventoryDocumentStatus;
  sourceLocationId?: string;
  destinationLocationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type InventoryDocumentQuery = {
  filters: InventoryDocumentFilters;
  page: number;
  pageSize: number;
};

export type InventoryDocumentCreateData = {
  document_type: InventoryDocumentType;
  source_location_id: string | null;
  destination_location_id: string | null;
  document_date: Date;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  idempotency_key: string | null;
  notes: string | null;
  created_by: string | null;
};

export type InventoryDocumentUpdateData = Partial<
  Omit<InventoryDocumentCreateData, "idempotency_key">
>;

export type InventoryDocumentLocationSummary = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: InventoryLocationType;
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryDocumentResponse = {
  inventory_document_id: string;
  reversal_of_document_id: string | null;
  source_location_id: string | null;
  destination_location_id: string | null;
  document_number: string;
  document_type: InventoryDocumentType;
  status: InventoryDocumentStatus;
  document_date: string;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  idempotency_key: string | null;
  total_cost: string;
  notes: string | null;
  cancellation_reason: string | null;
  reversal_reason: string | null;
  created_by: string | null;
  posted_by: string | null;
  received_by: string | null;
  cancelled_by: string | null;
  reversed_by: string | null;
  posted_at: string | null;
  received_at: string | null;
  cancelled_at: string | null;
  reversed_at: string | null;
  source_location: InventoryDocumentLocationSummary | null;
  destination_location: InventoryDocumentLocationSummary | null;
  lines_count: number;
  movements_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryDocumentDetailResponse = InventoryDocumentResponse & {
  lines: InventoryDocumentLineResponse[];
};

export type InventoryDocumentPaginationResponse = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous_page: boolean;
  has_next_page: boolean;
};

export type InventoryDocumentListResponse = {
  items: InventoryDocumentResponse[];
  pagination: InventoryDocumentPaginationResponse;
};

export type InventoryDocumentLocationRecord = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: InventoryLocationType;
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryDocumentListRecord = InventoryDocument & {
  source_location: InventoryDocumentLocationRecord | null;
  destination_location: InventoryDocumentLocationRecord | null;
  _count: {
    lines: number;
    movements: number;
  };
};

export type InventoryDocumentDetailRecord = InventoryDocumentListRecord & {
  lines: InventoryDocumentLineRecord[];
};
