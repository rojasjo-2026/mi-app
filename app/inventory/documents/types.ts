export type InventoryApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
};

export type InventoryDocumentType =
  | "OPENING_BALANCE"
  | "RECEIPT"
  | "ISSUE"
  | "TRANSFER"
  | "ADJUSTMENT_INCREASE"
  | "ADJUSTMENT_DECREASE"
  | "RETURN_IN"
  | "RETURN_OUT";

export type InventoryDocumentStatus =
  | "DRAFT"
  | "POSTED"
  | "IN_TRANSIT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED"
  | "REVERSED";

export type InventoryDocumentLocation = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: string;
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryDocumentLineProduct = {
  inventory_product_id: string;
  name: string;
  product_type: string;
  tracking_mode: string;
  manages_stock: boolean;
  is_active: boolean;
};

export type InventoryDocumentLineVariant = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  is_active: boolean;
  product: InventoryDocumentLineProduct;
};

export type InventoryDocumentLineCode = {
  inventory_product_code_id: string;
  inventory_product_variant_id: string;
  unit_of_measure_id: string | null;
  code: string;
  code_type: string;
  quantity_in_stock_unit: string;
  is_primary: boolean;
  is_scannable: boolean;
  is_active: boolean;
};

export type InventoryDocumentLineUnit = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryDocumentLine = {
  inventory_document_line_id: string;
  inventory_document_id: string;
  inventory_product_variant_id: string;
  inventory_product_code_id: string | null;
  unit_of_measure_id: string;
  line_number: number;
  quantity: string;
  conversion_factor: string;
  stock_quantity: string;
  received_stock_quantity: string;
  unit_cost: string;
  total_cost: string;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  unit_code_snapshot: string;
  code_snapshot: string | null;
  notes: string | null;
  variant: InventoryDocumentLineVariant;
  product_code: InventoryDocumentLineCode | null;
  unit_of_measure: InventoryDocumentLineUnit;
  created_at: string;
  updated_at: string;
};

export type InventoryDocument = {
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
  source_location: InventoryDocumentLocation | null;
  destination_location: InventoryDocumentLocation | null;
  lines_count: number;
  movements_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryDocumentDetail = InventoryDocument & {
  lines: InventoryDocumentLine[];
};

export type InventoryDocumentPagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous_page: boolean;
  has_next_page: boolean;
};

export type InventoryDocumentListData = {
  items: InventoryDocument[];
  pagination: InventoryDocumentPagination;
};
export type InventoryDocumentFilters = {
  documentType: "ALL" | InventoryDocumentType;
  status: "ALL" | InventoryDocumentStatus;
  dateFrom: string;
  dateTo: string;
  pageSize: number;
};

export type InventoryDocumentMetrics = {
  total: number;
  drafts: number;
  inTransit: number;
  totalValue: number;
};
