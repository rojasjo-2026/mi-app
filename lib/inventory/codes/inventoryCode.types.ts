import type { InventoryCodeType, InventoryProductCode } from "@prisma/client";

export type InventoryCodeFilters = {
  search?: string;
  activeOnly: boolean;
  variantId?: string;
  unitOfMeasureId?: string;
  codeType?: InventoryCodeType;
  isPrimary?: boolean;
  isScannable?: boolean;
};

export type InventoryCodeCreateData = {
  unit_of_measure_id: string | null;
  code: string;
  code_type: InventoryCodeType;
  label: string | null;
  quantity_in_stock_unit: string;
  is_primary: boolean;
  is_scannable: boolean;
};

export type InventoryCodeUpdateData = Partial<InventoryCodeCreateData> & {
  is_active?: boolean;
};

export type InventoryCodeUnitSummary = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryCodeResponse = {
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
  unit_of_measure: InventoryCodeUnitSummary | null;
  created_at: string;
  updated_at: string;
};

export type InventoryCodeUnitRecord = {
  unit_of_measure_id: string;
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
  is_active: boolean;
};

export type InventoryCodeListRecord = InventoryProductCode & {
  unit_of_measure: InventoryCodeUnitRecord | null;
};
