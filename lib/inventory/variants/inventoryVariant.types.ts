import type { InventoryProductVariant, Prisma } from "@prisma/client";

export type InventoryVariantCreateData = {
  stock_unit_id: string;
  name: string | null;
  attributes: Prisma.InputJsonObject;
  default_cost: string | null;
  default_price: string | null;
  minimum_stock: string;
  maximum_stock: string | null;
  is_default: boolean;
  sort_order: number;
};

export type InventoryVariantUpdateData = Partial<InventoryVariantCreateData> & {
  is_active?: boolean;
};

export type InventoryVariantFilters = {
  activeOnly: boolean;
  productId?: string;
  stockUnitId?: string;
  isDefault?: boolean;
  search?: string;
};

export type InventoryVariantUnitSummary = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryVariantCodeSummary = {
  inventory_product_code_id: string;
  code: string;
  code_type: string;
  label: string | null;
  is_primary: boolean;
  is_scannable: boolean;
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
  stock_unit: InventoryVariantUnitSummary;
};

export type InventoryVariantResponse = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  attributes: Prisma.JsonValue;
  default_cost: string | null;
  default_price: string | null;
  minimum_stock: string;
  maximum_stock: string | null;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  stock_unit: InventoryVariantUnitSummary;
  codes_count: number;
  stock_balances_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryVariantDetailResponse = InventoryVariantResponse & {
  codes: InventoryVariantCodeSummary[];
};

export type InventoryVariantUnitRecord = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryVariantCodeRecord = {
  inventory_product_code_id: string;
  code: string;
  code_type: string;
  label: string | null;
  is_primary: boolean;
  is_scannable: boolean;
  is_active: boolean;
};

export type InventoryVariantListRecord = InventoryProductVariant & {
  stock_unit: InventoryVariantUnitRecord;
  _count: {
    codes: number;
    stock_balances: number;
  };
};

export type InventoryVariantDetailRecord = InventoryVariantListRecord & {
  codes: InventoryVariantCodeRecord[];
};
