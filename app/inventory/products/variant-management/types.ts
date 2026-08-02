import type { InventoryVariant, InventoryVariantUnit } from "../types";

export type InventoryCodeType =
  "SKU" | "BARCODE" | "QR" | "SUPPLIER" | "ALTERNATE";

export type InventoryVariantCodeSummary = {
  inventory_product_code_id: string;
  code: string;
  code_type: InventoryCodeType;
  label: string | null;
  is_primary: boolean;
  is_scannable: boolean;
  is_active: boolean;
};

export type InventoryVariantDetail = InventoryVariant & {
  codes: InventoryVariantCodeSummary[];
};

export type InventoryCode = {
  inventory_product_code_id: string;
  inventory_product_variant_id: string;
  unit_of_measure_id: string | null;
  code: string;
  code_type: InventoryCodeType;
  label: string | null;
  quantity_in_stock_unit: string;
  is_primary: boolean;
  is_scannable: boolean;
  is_active: boolean;
  unit_of_measure: InventoryVariantUnit | null;
  created_at: string;
  updated_at: string;
};

export type InventoryVariantFormMode = "create" | "edit";

export type InventoryVariantFormState = {
  stockUnitId: string;
  name: string;
  defaultCost: string;
  defaultPrice: string;
  minimumStock: string;
  maximumStock: string;
  isDefault: boolean;
  sortOrder: string;
};

export type InventoryVariantFormErrors = Partial<
  Record<keyof InventoryVariantFormState, string>
>;

export type InventoryCodeFormMode = "create" | "edit";

export type InventoryCodeFormState = {
  unitOfMeasureId: string;
  code: string;
  codeType: InventoryCodeType;
  label: string;
  quantityInStockUnit: string;
  isPrimary: boolean;
  isScannable: boolean;
};

export type InventoryCodeFormErrors = Partial<
  Record<keyof InventoryCodeFormState, string>
>;

export type InventoryVariantManagementState = {
  selectedVariantId: string | null;
  selectedCodeId: string | null;
  variantFormMode: InventoryVariantFormMode | null;
  codeFormMode: InventoryCodeFormMode | null;
};

export type InventoryVariantMutationInput = {
  stock_unit_id: string;
  name: string | null;
  default_cost: string | null;
  default_price: string | null;
  minimum_stock: string;
  maximum_stock: string | null;
  is_default: boolean;
  sort_order: number;
  attributes: Record<string, unknown>;
};

export type InventoryCodeMutationInput = {
  unit_of_measure_id: string | null;
  code: string;
  code_type: InventoryCodeType;
  label: string | null;
  quantity_in_stock_unit: string;
  is_primary: boolean;
  is_scannable: boolean;
};
