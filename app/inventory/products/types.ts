export type InventoryApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
};

export type InventoryProductType =
  | "STOCK_ITEM"
  | "CONSUMABLE"
  | "SPARE_PART"
  | "ASSET"
  | "RAW_MATERIAL"
  | "FINISHED_GOOD"
  | "KIT"
  | "SERVICE";

export type InventoryTrackingMode = "NONE" | "SERIAL" | "LOT";

export type InventoryProductCategorySummary = {
  inventory_category_id: string;
  category_code: string | null;
  name: string;
  is_active: boolean;
};

export type InventoryVariantUnit = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryVariantSummary = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  stock_unit: InventoryVariantUnit;
};

export type InventoryProduct = {
  inventory_product_id: string;
  inventory_category_id: string | null;
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  product_type: InventoryProductType;
  tracking_mode: InventoryTrackingMode;
  manages_stock: boolean;
  has_expiration: boolean;
  allow_negative_stock: boolean;
  tax_exempt: boolean;
  tax_rate: string | null;
  attributes: unknown;
  is_active: boolean;
  category: InventoryProductCategorySummary | null;
  variants_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryProductDetail = InventoryProduct & {
  variants: InventoryVariantSummary[];
};

export type InventoryVariant = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  attributes: unknown;
  default_cost: string | null;
  default_price: string | null;
  minimum_stock: string;
  maximum_stock: string | null;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  stock_unit: InventoryVariantUnit;
  codes_count: number;
  stock_balances_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryCategory = {
  inventory_category_id: string;
  parent_category_id: string | null;
  category_code: string | null;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  parent: InventoryProductCategorySummary | null;
  children_count: number;
  products_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryUnitOfMeasure = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type InventoryProductFilters = {
  activeOnly: boolean;
  categoryId: string;
  productType: string;
  trackingMode: string;
  managesStock: "ALL" | "YES" | "NO";
  brand: string;
  pageSize: number;
};

export type InventoryProductMetricsData = {
  products: number;
  activeProducts: number;
  stockProducts: number;
  variants: number;
  categories: number;
};
