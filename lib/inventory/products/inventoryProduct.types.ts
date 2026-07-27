import type {
  InventoryProduct,
  InventoryProductType,
  InventoryTrackingMode,
  Prisma,
} from "@prisma/client";

import type {
  InventoryVariantCreateData,
  InventoryVariantSummary,
  InventoryVariantUnitRecord,
} from "../variants/inventoryVariant.types";

export type InventoryProductFilters = {
  search?: string;
  activeOnly: boolean;
  categoryId?: string;
  productType?: InventoryProductType;
  trackingMode?: InventoryTrackingMode;
  managesStock?: boolean;
  brand?: string;
};

export type InventoryProductCreateData = {
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
  attributes: Prisma.InputJsonObject;
  default_variant: InventoryVariantCreateData;
};

export type InventoryProductUpdateData = Partial<
  Omit<InventoryProductCreateData, "default_variant">
> & {
  is_active?: boolean;
};

export type InventoryProductCategorySummary = {
  inventory_category_id: string;
  category_code: string | null;
  name: string;
  is_active: boolean;
};

export type InventoryProductResponse = {
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
  attributes: Prisma.JsonValue;
  is_active: boolean;
  category: InventoryProductCategorySummary | null;
  variants_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryProductDetailResponse = InventoryProductResponse & {
  variants: InventoryVariantSummary[];
};

export type InventoryProductCategoryRecord = {
  inventory_category_id: string;
  category_code: string | null;
  name: string;
  is_active: boolean;
};

export type InventoryProductVariantRecord = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  stock_unit: InventoryVariantUnitRecord;
};

export type InventoryProductListRecord = InventoryProduct & {
  category: InventoryProductCategoryRecord | null;
  _count: {
    variants: number;
  };
};

export type InventoryProductDetailRecord = InventoryProductListRecord & {
  variants: InventoryProductVariantRecord[];
};
