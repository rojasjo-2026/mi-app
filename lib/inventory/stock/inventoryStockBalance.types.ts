import type {
  InventoryLocationType,
  InventoryProductType,
  InventoryStockBalance,
  InventoryTrackingMode,
  Prisma,
} from "@prisma/client";

export type InventoryStockBalanceFilters = {
  search?: string;
  activeOnly: boolean;
  includeZero: boolean;
  variantId?: string;
  productId?: string;
  locationId?: string;
};

export type InventoryStockProductSummary = {
  inventory_product_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  product_type: InventoryProductType;
  tracking_mode: InventoryTrackingMode;
  manages_stock: boolean;
  allow_negative_stock: boolean;
  is_active: boolean;
};

export type InventoryStockUnitSummary = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryStockVariantSummary = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  minimum_stock: string;
  maximum_stock: string | null;
  is_default: boolean;
  is_active: boolean;
  product: InventoryStockProductSummary;
  stock_unit: InventoryStockUnitSummary;
};

export type InventoryStockLocationSummary = {
  inventory_location_id: string;
  parent_location_id: string | null;
  location_code: string;
  name: string;
  location_type: InventoryLocationType;
  allows_stock: boolean;
  is_default: boolean;
  is_active: boolean;
};

export type InventoryStockBalanceResponse = {
  inventory_stock_balance_id: string;
  inventory_product_variant_id: string;
  inventory_location_id: string;
  quantity_on_hand: string;
  quantity_reserved: string;
  quantity_available: string;
  average_unit_cost: string;
  inventory_value: string;
  version: number;
  variant: InventoryStockVariantSummary;
  location: InventoryStockLocationSummary;
  created_at: string;
  updated_at: string;
};

export type InventoryStockProductRecord = {
  inventory_product_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  product_type: InventoryProductType;
  tracking_mode: InventoryTrackingMode;
  manages_stock: boolean;
  allow_negative_stock: boolean;
  is_active: boolean;
};

export type InventoryStockUnitRecord = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryStockVariantRecord = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  minimum_stock: Prisma.Decimal;
  maximum_stock: Prisma.Decimal | null;
  is_default: boolean;
  is_active: boolean;
  product: InventoryStockProductRecord;
  stock_unit: InventoryStockUnitRecord;
};

export type InventoryStockLocationRecord = {
  inventory_location_id: string;
  parent_location_id: string | null;
  location_code: string;
  name: string;
  location_type: InventoryLocationType;
  allows_stock: boolean;
  is_default: boolean;
  is_active: boolean;
};

export type InventoryStockBalanceRecord = InventoryStockBalance & {
  variant: InventoryStockVariantRecord;
  location: InventoryStockLocationRecord;
};
