import type {
  InventoryDocumentStatus,
  InventoryDocumentType,
  InventoryReservationStatus,
} from "@prisma/client";

import type { InventoryReservationDetailResponse } from "./inventoryReservation.types";

export type InventoryReservationExpirationFilter =
  "ANY" | "WITHOUT_DATE" | "UPCOMING" | "OVERDUE";

export type InventoryReservationSortBy =
  "reservation_number" | "status" | "expires_at" | "created_at" | "updated_at";

export type InventoryReservationSortDirection = "asc" | "desc";

export type InventoryReservationQueryFilters = {
  statuses: InventoryReservationStatus[];
  inventoryLocationId?: string;
  inventoryProductVariantId?: string;
  inventoryProductId?: string;
  referenceType?: string;
  referenceId?: string;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  expiresFrom?: Date;
  expiresTo?: Date;
  expirationFilter: InventoryReservationExpirationFilter;
};

export type InventoryReservationQuery = {
  filters: InventoryReservationQueryFilters;
  page: number;
  pageSize: number;
  sortBy: InventoryReservationSortBy;
  sortDirection: InventoryReservationSortDirection;
  expiringWithinDays: number;
  asOf: Date;
};

export type InventoryReservationQuantityTotals = {
  requested: string;
  reserved: string;
  consumed: string;
  released: string;
};

export type InventoryReservationActionAvailability = {
  can_activate: boolean;
  can_consume: boolean;
  can_release: boolean;
  can_expire: boolean;
  can_cancel: boolean;
};

export type InventoryReservationExpirationSummary = {
  has_expiration: boolean;
  is_overdue: boolean;
  is_expiring_soon: boolean;
  days_until_expiration: number | null;
};

export type InventoryReservationListProductSummary = {
  inventory_product_id: string;
  product_name: string;
  inventory_product_variant_id: string;
  variant_name: string | null;
};

export type InventoryReservationListLocationSummary = {
  inventory_location_id: string;
  location_code: string;
  location_name: string;
};

export type InventoryReservationListItemResponse = {
  inventory_reservation_id: string;
  reservation_number: string;
  status: InventoryReservationStatus;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  expires_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  line_count: number;
  event_count: number;
  product_count: number;
  location_count: number;
  quantity_totals: InventoryReservationQuantityTotals;
  expiration: InventoryReservationExpirationSummary;
  actions: InventoryReservationActionAvailability;
  products: InventoryReservationListProductSummary[];
  locations: InventoryReservationListLocationSummary[];
};

export type InventoryReservationPaginationResponse = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous_page: boolean;
  has_next_page: boolean;
};

export type InventoryReservationListResponse = {
  items: InventoryReservationListItemResponse[];
  pagination: InventoryReservationPaginationResponse;
};

export type InventoryReservationConsumptionDocumentResponse = {
  inventory_document_id: string;
  document_number: string;
  document_type: InventoryDocumentType;
  status: InventoryDocumentStatus;
  document_date: string;
  total_cost: string;
  posted_by: string | null;
  posted_at: string | null;
  created_at: string;
  lines_count: number;
  movements_count: number;
};

export type InventoryReservationManagementDetailResponse =
  InventoryReservationDetailResponse & {
    quantity_totals: InventoryReservationQuantityTotals;
    expiration: InventoryReservationExpirationSummary;
    actions: InventoryReservationActionAvailability;
    related_consumption_documents: InventoryReservationConsumptionDocumentResponse[];
  };
