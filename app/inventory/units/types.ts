export type InventoryApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
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

export type InventoryUnitFilters = {
  activeOnly: boolean;
  decimalMode: "ALL" | "DECIMAL" | "INTEGER";
  pageSize: number;
};

export type InventoryUnitMetricsData = {
  units: number;
  activeUnits: number;
  decimalUnits: number;
  integerUnits: number;
};

export type InventoryUnitFormMode = "create" | "edit";

export type InventoryUnitFormState = {
  code: string;
  name: string;
  symbol: string;
  allowsDecimal: boolean;
  decimalScale: string;
};

export type InventoryUnitFormErrors = Partial<
  Record<keyof InventoryUnitFormState, string>
>;
