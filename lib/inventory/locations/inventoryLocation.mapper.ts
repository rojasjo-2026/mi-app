import type {
  InventoryLocationDetailRecord,
  InventoryLocationDetailResponse,
  InventoryLocationListRecord,
  InventoryLocationRelationRecord,
  InventoryLocationResponse,
  InventoryLocationSummary,
} from "./inventoryLocation.types";

function mapInventoryLocationSummary(
  location: InventoryLocationRelationRecord,
): InventoryLocationSummary {
  return {
    inventory_location_id: location.inventory_location_id,
    location_code: location.location_code,
    name: location.name,
    location_type: location.location_type,
    allows_stock: location.allows_stock,
    is_active: location.is_active,
  };
}

export function mapInventoryLocation(
  location: InventoryLocationListRecord,
): InventoryLocationResponse {
  return {
    inventory_location_id: location.inventory_location_id,
    parent_location_id: location.parent_location_id,
    location_code: location.location_code,
    name: location.name,
    description: location.description,
    location_type: location.location_type,
    country_code: location.country_code,
    address_line: location.address_line,
    reference_point: location.reference_point,
    latitude: location.latitude?.toString() ?? null,
    longitude: location.longitude?.toString() ?? null,
    allows_stock: location.allows_stock,
    is_default: location.is_default,
    sort_order: location.sort_order,
    is_active: location.is_active,
    metadata: location.metadata,
    parent: location.parent
      ? mapInventoryLocationSummary(location.parent)
      : null,
    children_count: location._count.children,
    stock_balances_count: location._count.stock_balances,
    created_at: location.created_at.toISOString(),
    updated_at: location.updated_at.toISOString(),
  };
}

export function mapInventoryLocations(
  locations: InventoryLocationListRecord[],
): InventoryLocationResponse[] {
  return locations.map(mapInventoryLocation);
}

export function mapInventoryLocationDetail(
  location: InventoryLocationDetailRecord,
): InventoryLocationDetailResponse {
  return {
    ...mapInventoryLocation(location),
    children: location.children.map(mapInventoryLocationSummary),
  };
}
