export type InventoryReservationStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PARTIALLY_CONSUMED"
  | "CONSUMED"
  | "RELEASED"
  | "EXPIRED"
  | "CANCELLED";

export type InventoryReservationExpirationFilter =
  "ANY" | "WITHOUT_DATE" | "UPCOMING" | "OVERDUE";

export type InventoryReservationSortOption =
  | "updated_desc"
  | "created_desc"
  | "created_asc"
  | "expires_asc"
  | "reservation_asc";

export type InventoryReservationQuantityTotals = {
  requested: string;
  reserved: string;
  consumed: string;
  released: string;
};

export type InventoryReservationExpirationSummary = {
  has_expiration: boolean;
  is_overdue: boolean;
  is_expiring_soon: boolean;
  days_until_expiration: number | null;
};

export type InventoryReservationActionAvailability = {
  can_activate: boolean;
  can_consume: boolean;
  can_release: boolean;
  can_expire: boolean;
  can_cancel: boolean;
};

export type InventoryReservationProductSummary = {
  inventory_product_id: string;
  product_name: string;
  inventory_product_variant_id: string;
  variant_name: string | null;
};

export type InventoryReservationLocationSummary = {
  inventory_location_id: string;
  location_code: string;
  location_name: string;
};

export type InventoryReservationListItem = {
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
  products: InventoryReservationProductSummary[];
  locations: InventoryReservationLocationSummary[];
};

export type InventoryReservationPagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous_page: boolean;
  has_next_page: boolean;
};

export type InventoryReservationListData = {
  items: InventoryReservationListItem[];
  pagination: InventoryReservationPagination;
};

export type InventoryReservationDetailLine = {
  inventory_reservation_line_id: string;
  inventory_reservation_id: string;
  inventory_product_variant_id: string;
  inventory_location_id: string;
  line_number: number;
  quantity_requested: string;
  quantity_reserved: string;
  quantity_consumed: string;
  quantity_released: string;
  notes: string | null;
  variant: {
    inventory_product_variant_id: string;
    inventory_product_id: string;
    stock_unit_id: string;
    name: string | null;
    is_default: boolean;
    is_active: boolean;
    product: {
      inventory_product_id: string;
      name: string;
      product_type: string;
      tracking_mode: string;
      manages_stock: boolean;
      is_active: boolean;
    };
  };
  location: {
    inventory_location_id: string;
    location_code: string;
    name: string;
    location_type: string;
    allows_stock: boolean;
    is_active: boolean;
  };
  created_at: string;
  updated_at: string;
};

export type InventoryReservationEvent = {
  inventory_reservation_event_id: string;
  inventory_reservation_id: string;
  inventory_reservation_line_id: string | null;
  event_type: string;
  previous_status: InventoryReservationStatus | null;
  new_status: InventoryReservationStatus | null;
  quantity: string | null;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  reason: string | null;
  metadata: unknown;
  created_by: string | null;
  created_at: string;
};

export type InventoryReservationRelatedDocument = {
  inventory_document_id: string;
  document_number: string;
  document_type: string;
  status: string;
  document_date: string;
  total_cost: string;
  posted_by: string | null;
  posted_at: string | null;
  created_at: string;
  lines_count: number;
  movements_count: number;
};

export type InventoryReservationDetail = {
  inventory_reservation_id: string;
  reservation_number: string;
  status: InventoryReservationStatus;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  idempotency_key: string | null;
  expires_at: string | null;
  notes: string | null;
  created_by: string | null;
  activated_by: string | null;
  released_by: string | null;
  expired_by: string | null;
  cancelled_by: string | null;
  activated_at: string | null;
  consumed_at: string | null;
  released_at: string | null;
  expired_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  lines: InventoryReservationDetailLine[];
  events: InventoryReservationEvent[];
  quantity_totals: InventoryReservationQuantityTotals;
  expiration: InventoryReservationExpirationSummary;
  actions: InventoryReservationActionAvailability;
  related_consumption_documents: InventoryReservationRelatedDocument[];
};

export type InventoryReservationFilters = {
  status: "ALL" | InventoryReservationStatus;
  expiration: InventoryReservationExpirationFilter;
  sort: InventoryReservationSortOption;
  pageSize: number;
};

export type InventoryReservationMetrics = {
  operational: number;
  drafts: number;
  upcoming: number;
  overdue: number;
};

export type InventoryApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
};
