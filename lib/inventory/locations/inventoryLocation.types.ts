import type {
  InventoryLocation,
  InventoryLocationType,
  Prisma,
} from "@prisma/client";

export type InventoryLocationFilters = {
  search?: string;
  activeOnly: boolean;
  locationType?: InventoryLocationType;
  parentLocationId?: string;
  rootOnly: boolean;
  allowsStock?: boolean;
  countryCode?: string;
  isDefault?: boolean;
};

export type InventoryLocationCreateData = {
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
  metadata: Prisma.InputJsonObject;
};

export type InventoryLocationUpdateData =
  Partial<InventoryLocationCreateData> & {
    is_active?: boolean;
  };

export type InventoryLocationSummary = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: InventoryLocationType;
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryLocationResponse = {
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
  metadata: Prisma.JsonValue;
  parent: InventoryLocationSummary | null;
  children_count: number;
  stock_balances_count: number;
  created_at: string;
  updated_at: string;
};

export type InventoryLocationDetailResponse = InventoryLocationResponse & {
  children: InventoryLocationSummary[];
};

export type InventoryLocationRelationRecord = {
  inventory_location_id: string;
  location_code: string;
  name: string;
  location_type: InventoryLocationType;
  allows_stock: boolean;
  is_active: boolean;
};

export type InventoryLocationListRecord = InventoryLocation & {
  parent: InventoryLocationRelationRecord | null;
  _count: {
    children: number;
    stock_balances: number;
  };
};

export type InventoryLocationDetailRecord = InventoryLocationListRecord & {
  children: InventoryLocationRelationRecord[];
};

export type InventoryLocationParentLink = {
  inventory_location_id: string;
  parent_location_id: string | null;
  is_active: boolean;
};

export type InventoryLocationStockTotals = {
  quantity_on_hand: Prisma.Decimal | null;
  quantity_reserved: Prisma.Decimal | null;
};
