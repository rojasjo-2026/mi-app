export type InventoryApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
};

export type InventoryLocationType =
  | "WAREHOUSE"
  | "STORAGE_AREA"
  | "BRANCH"
  | "WORKSHOP"
  | "VEHICLE"
  | "STAFF"
  | "IN_TRANSIT"
  | "REPAIR"
  | "DAMAGED"
  | "VIRTUAL";

export type InventoryLocationSummary = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: InventoryLocationType;
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryLocation = {
  inventory_location_id: string;
  parent_location_id: string | null;
  location_code: string;
  name: string;
  description: string | null;
  location_type: InventoryLocationType;
  country_code: string | null;
  address_line: string | null;
  reference_point: string | null;
  latitude: string | null;
  longitude: string | null;
  allows_stock: boolean;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  metadata: unknown;
  parent: InventoryLocationSummary | null;
  children_count: number;
  stock_balances_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryLocationDetail = InventoryLocation & {
  children: InventoryLocationSummary[];
};

export type InventoryLocationHierarchyMode = "ALL" | "ROOT";

export type InventoryLocationStockMode = "ALL" | "ALLOWS_STOCK" | "NO_STOCK";

export type InventoryLocationDefaultMode = "ALL" | "DEFAULT" | "NOT_DEFAULT";

export type InventoryLocationFilters = {
  activeOnly: boolean;
  hierarchyMode: InventoryLocationHierarchyMode;
  parentLocationId: string;
  locationType: InventoryLocationType | "ALL";
  stockMode: InventoryLocationStockMode;
  defaultMode: InventoryLocationDefaultMode;
  pageSize: number;
};

export type InventoryLocationMetricsData = {
  locations: number;
  activeLocations: number;
  stockLocations: number;
  rootLocations: number;
  stockBalances: number;
};

export type InventoryLocationFormMode = "create" | "edit";

export type InventoryLocationFormState = {
  locationCode: string;
  name: string;
  description: string;
  locationType: InventoryLocationType;
  parentLocationId: string;
  countryCode: string;
  addressLine: string;
  referencePoint: string;
  latitude: string;
  longitude: string;
  allowsStock: boolean;
  isDefault: boolean;
  sortOrder: string;
  metadataText: string;
};

export type InventoryLocationFormErrors = Partial<
  Record<keyof InventoryLocationFormState, string>
>;
