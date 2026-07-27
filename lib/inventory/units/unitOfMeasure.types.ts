export type UnitOfMeasureFilters = {
  search?: string;
  activeOnly: boolean;
};

export type UnitOfMeasureCreateData = {
  code: string;
  name: string;
  symbol: string | null;
  allows_decimal: boolean;
  decimal_scale: number;
};

export type UnitOfMeasureUpdateData = Partial<UnitOfMeasureCreateData> & {
  is_active?: boolean;
};

export type UnitOfMeasureResponse = {
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
