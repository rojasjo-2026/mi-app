import type {
  InventoryCodeType,
  InventoryDocumentLine,
  InventoryProductType,
  InventoryTrackingMode,
} from "@prisma/client";

export type InventoryDocumentLineCreateInputData = {
  inventory_product_variant_id: string;
  inventory_product_code_id: string | null;
  unit_of_measure_id: string;
  quantity: string;
  conversion_factor: string;
  unit_cost: string;
  notes: string | null;
};

export type InventoryDocumentLineUpdateInputData =
  Partial<InventoryDocumentLineCreateInputData>;

export type InventoryDocumentLineResolvedData =
  InventoryDocumentLineCreateInputData & {
    stock_quantity: string;
    total_cost: string;
    product_name_snapshot: string;
    variant_name_snapshot: string | null;
    unit_code_snapshot: string;
    code_snapshot: string | null;
  };

export type InventoryDocumentLineProductSummary = {
  inventory_product_id: string;
  name: string;
  product_type: InventoryProductType;
  tracking_mode: InventoryTrackingMode;
  manages_stock: boolean;
  is_active: boolean;
};

export type InventoryDocumentLineVariantSummary = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  is_active: boolean;
  product: InventoryDocumentLineProductSummary;
};

export type InventoryDocumentLineCodeSummary = {
  inventory_product_code_id: string;
  inventory_product_variant_id: string;
  unit_of_measure_id: string | null;
  code: string;
  code_type: InventoryCodeType;
  quantity_in_stock_unit: string;
  is_primary: boolean;
  is_scannable: boolean;
  is_active: boolean;
};

export type InventoryDocumentLineUnitSummary = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryDocumentLineResponse = {
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
  variant: InventoryDocumentLineVariantSummary;
  product_code: InventoryDocumentLineCodeSummary | null;
  unit_of_measure: InventoryDocumentLineUnitSummary;
  created_at: string;
  updated_at: string;
};

export type InventoryDocumentLineProductRecord = {
  inventory_product_id: string;
  name: string;
  product_type: InventoryProductType;
  tracking_mode: InventoryTrackingMode;
  manages_stock: boolean;
  is_active: boolean;
};

export type InventoryDocumentLineVariantRecord = {
  inventory_product_variant_id: string;
  inventory_product_id: string;
  stock_unit_id: string;
  name: string | null;
  is_default: boolean;
  is_active: boolean;
  product: InventoryDocumentLineProductRecord;
};

export type InventoryDocumentLineCodeRecord = {
  inventory_product_code_id: string;
  inventory_product_variant_id: string;
  unit_of_measure_id: string | null;
  code: string;
  code_type: InventoryCodeType;
  quantity_in_stock_unit: {
    toString(): string;
  };
  is_primary: boolean;
  is_scannable: boolean;
  is_active: boolean;
};

export type InventoryDocumentLineUnitRecord = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryDocumentLineRecord = InventoryDocumentLine & {
  variant: InventoryDocumentLineVariantRecord;
  product_code: InventoryDocumentLineCodeRecord | null;
  unit_of_measure: InventoryDocumentLineUnitRecord;
};
