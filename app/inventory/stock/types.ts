export type InventoryApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
};

export type InventoryStockProduct = {
  inventory_product_id: string;
  name: string;
  product_type: string;
  tracking_mode: string;
  manages_stock: boolean;
  allow_negative_stock: boolean;
  is_active: boolean;
};

export type InventoryStockVariant = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  is_active: boolean;
};

export type InventoryStockUnit = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryStockLocation = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: string;
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryStockBalance = {
  inventory_stock_balance_id: string;
  inventory_product_variant_id: string;
  inventory_location_id: string;

  quantity_on_hand: string;
  quantity_reserved: string;
  available_quantity: string;

  average_unit_cost: string;
  inventory_value: string;

  version: number;

  product: InventoryStockProduct;
  variant: InventoryStockVariant;
  stock_unit: InventoryStockUnit;
  location: InventoryStockLocation;

  created_at: string;
  updated_at: string;
};

export type InventoryStockPagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous_page: boolean;
  has_next_page: boolean;
};

export type InventoryStockListData = {
  items: InventoryStockBalance[];
  pagination: InventoryStockPagination;
};

export type InventoryStockFilters = {
  onlyWithStock: boolean;
  includeInactive: boolean;
  pageSize: number;
};

export type InventoryStockMetricsData = {
  balances: number;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
};
