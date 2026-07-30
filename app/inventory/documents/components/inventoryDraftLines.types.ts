import type { InventoryDocumentDetail } from "../types";

export type InventoryDraftLine = NonNullable<
  InventoryDocumentDetail["lines"]
>[number];

export type InventoryCatalogUnit = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryCatalogVariantSummary = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  stock_unit: InventoryCatalogUnit;
};

export type InventoryCatalogProduct = {
  inventory_product_id: string;
  name: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  manages_stock: boolean;
  is_active: boolean;
  variants_count: number;
};

export type InventoryCatalogProductDetail = InventoryCatalogProduct & {
  variants: InventoryCatalogVariantSummary[];
};

export type InventoryCatalogVariantDetail = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  default_cost: string | null;
  is_default: boolean;
  is_active: boolean;
  stock_unit: InventoryCatalogUnit;
};

export type DeletedLineResponse = {
  inventory_document_line_id: string;
  inventory_document_id: string;
  deleted: true;
};
