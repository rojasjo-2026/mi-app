export type InventoryApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
};

export type InventoryMovementDocument = {
  inventory_document_id: string;
  reversal_of_document_id: string | null;
  document_number: string;
  document_type: string;
  status: string;
  document_date: string;
  reference_number: string | null;
};

export type InventoryMovementDocumentLine = {
  inventory_document_line_id: string;
  line_number: number;
};

export type InventoryMovementProduct = {
  inventory_product_id: string;
  name: string;
  product_type: string;
  tracking_mode: string;
  manages_stock: boolean;
  allow_negative_stock: boolean;
  is_active: boolean;
};

export type InventoryMovementVariant = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  is_active: boolean;
};

export type InventoryMovementUnit = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryMovementLocation = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: string;
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryMovementLink = {
  inventory_movement_id: string;
  posting_key: string;
  movement_type: string;
  movement_at: string;
};

export type InventoryMovement = {
  inventory_movement_id: string;
  reversal_of_movement_id: string | null;
  reversal_movement_id: string | null;

  inventory_document_id: string;
  inventory_document_line_id: string;
  inventory_product_variant_id: string;
  inventory_location_id: string;

  posting_key: string;
  movement_type: string;

  quantity_delta: string;
  quantity_in: string;
  quantity_out: string;

  unit_cost: string;

  total_cost_delta: string;
  value_in: string;
  value_out: string;

  movement_at: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;

  document: InventoryMovementDocument;
  document_line: InventoryMovementDocumentLine;
  product: InventoryMovementProduct;
  variant: InventoryMovementVariant;
  stock_unit: InventoryMovementUnit;
  location: InventoryMovementLocation;

  reversal_of_movement: InventoryMovementLink | null;
  reversal_movement: InventoryMovementLink | null;
};

export type InventoryMovementPagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous_page: boolean;
  has_next_page: boolean;
};

export type InventoryMovementListData = {
  items: InventoryMovement[];
  pagination: InventoryMovementPagination;
};

export type InventoryMovementFilters = {
  movementType: string;
  locationId: string;
  dateFrom: string;
  dateTo: string;
  pageSize: number;
};

export type InventoryMovementMetricsData = {
  movements: number;
  quantityIn: number;
  quantityOut: number;
  valueIn: number;
  valueOut: number;
};
