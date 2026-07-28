import type {
  InventoryLocation,
  InventoryProduct,
  InventoryProductVariant,
  Prisma,
  UnitOfMeasure,
} from "@prisma/client";

export type InventoryStockBalanceFilters = {
  inventoryLocationId?: string;
  inventoryProductVariantId?: string;
  inventoryProductId?: string;
  search?: string;
  onlyWithStock: boolean;
  includeInactive: boolean;
};

export type InventoryStockBalanceQuery = {
  filters: InventoryStockBalanceFilters;
  page: number;
  pageSize: number;
};

export type InventoryStockBalanceProductResponse = {
  inventory_product_id: string;
  name: string;
  product_type: InventoryProduct["product_type"];
  tracking_mode: InventoryProduct["tracking_mode"];
  manages_stock: boolean;
  allow_negative_stock: boolean;
  is_active: boolean;
};

export type InventoryStockBalanceVariantResponse = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  is_active: boolean;
};

export type InventoryStockBalanceUnitResponse = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryStockBalanceLocationResponse = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: InventoryLocation["location_type"];
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryStockBalanceResponse = {
  inventory_stock_balance_id: string;
  inventory_product_variant_id: string;
  inventory_location_id: string;

  quantity_on_hand: string;
  quantity_reserved: string;
  available_quantity: string;

  average_unit_cost: string;
  inventory_value: string;

  version: number;

  product: InventoryStockBalanceProductResponse;
  variant: InventoryStockBalanceVariantResponse;
  stock_unit: InventoryStockBalanceUnitResponse;
  location: InventoryStockBalanceLocationResponse;

  created_at: string;
  updated_at: string;
};

export type InventoryStockBalancePaginationResponse = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_previous_page: boolean;
  has_next_page: boolean;
};

export type InventoryStockBalanceListResponse = {
  items: InventoryStockBalanceResponse[];
  pagination: InventoryStockBalancePaginationResponse;
};

export type InventoryStockBalanceRecord =
  Prisma.InventoryStockBalanceGetPayload<{
    include: {
      location: true;

      variant: {
        include: {
          product: true;
          stock_unit: true;
        };
      };
    };
  }>;

export type InventoryStockBalanceProductRecord = InventoryProduct;

export type InventoryStockBalanceVariantRecord = InventoryProductVariant;

export type InventoryStockBalanceUnitRecord = UnitOfMeasure;

export type InventoryStockBalanceLocationRecord = InventoryLocation;
