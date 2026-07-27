import {
  normalizeCatalogOptionalBoolean,
  normalizeCatalogSearch,
  normalizeCatalogUuid,
} from "../shared/inventoryCatalogValidation";

import type { InventoryStockBalanceFilters } from "./inventoryStockBalance.types";

export function normalizeInventoryStockBalanceId(value: unknown) {
  return normalizeCatalogUuid(value, "El id del saldo de inventario");
}

function normalizeOptionalId(value: string | null, fieldLabel: string) {
  return value ? normalizeCatalogUuid(value, fieldLabel) : undefined;
}

export function normalizeInventoryStockBalanceFilters(
  searchParams: URLSearchParams,
): InventoryStockBalanceFilters {
  return {
    search: normalizeCatalogSearch(searchParams.get("search")),
    activeOnly:
      normalizeCatalogOptionalBoolean(
        searchParams.get("active_only") ?? undefined,
        "El filtro activo",
      ) ?? true,
    includeZero:
      normalizeCatalogOptionalBoolean(
        searchParams.get("include_zero") ?? undefined,
        "El filtro de saldos en cero",
      ) ?? false,
    variantId: normalizeOptionalId(
      searchParams.get("variant_id"),
      "El id de la variante",
    ),
    productId: normalizeOptionalId(
      searchParams.get("product_id"),
      "El id del producto",
    ),
    locationId: normalizeOptionalId(
      searchParams.get("location_id"),
      "El id de la ubicación",
    ),
  };
}
