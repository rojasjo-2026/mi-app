import type {
  InventoryLocationFilters,
  InventoryLocationMetricsData,
} from "../types";
import type { InventoryLocationTreeItem } from "./inventoryLocationUi";

export function createDefaultInventoryLocationFilters(): InventoryLocationFilters {
  return {
    activeOnly: true,
    hierarchyMode: "ALL",
    parentLocationId: "",
    locationType: "ALL",
    stockMode: "ALL",
    defaultMode: "ALL",
    pageSize: 10,
  };
}

export function calculateInventoryLocationMetrics(
  locations: InventoryLocationTreeItem[],
): InventoryLocationMetricsData {
  return locations.reduce<InventoryLocationMetricsData>(
    (metrics, location) => ({
      locations: metrics.locations + 1,
      activeLocations: metrics.activeLocations + (location.is_active ? 1 : 0),
      stockLocations: metrics.stockLocations + (location.allows_stock ? 1 : 0),
      rootLocations:
        metrics.rootLocations + (location.parent_location_id ? 0 : 1),
      stockBalances: metrics.stockBalances + location.stock_balances_count,
    }),
    {
      locations: 0,
      activeLocations: 0,
      stockLocations: 0,
      rootLocations: 0,
      stockBalances: 0,
    },
  );
}

export function hasInventoryLocationFilters(
  search: string,
  filters: InventoryLocationFilters,
) {
  const defaults = createDefaultInventoryLocationFilters();

  return (
    Boolean(search.trim()) ||
    filters.activeOnly !== defaults.activeOnly ||
    filters.hierarchyMode !== defaults.hierarchyMode ||
    Boolean(filters.parentLocationId) ||
    filters.locationType !== defaults.locationType ||
    filters.stockMode !== defaults.stockMode ||
    filters.defaultMode !== defaults.defaultMode
  );
}

export function paginateInventoryLocations(
  locations: InventoryLocationTreeItem[],
  page: number,
  pageSize: number,
) {
  const totalPages = Math.max(1, Math.ceil(locations.length / pageSize));

  const safePage = Math.min(Math.max(page, 1), totalPages);

  const startIndex = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    items: locations.slice(startIndex, startIndex + pageSize),
  };
}
