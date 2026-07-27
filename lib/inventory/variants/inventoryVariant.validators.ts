import { Prisma } from "@prisma/client";

import { InventoryValidationError } from "../shared/inventoryErrors";

import {
  normalizeCatalogDecimal,
  normalizeCatalogInputRecord,
  normalizeCatalogJsonObject,
  normalizeCatalogOptionalBoolean,
  normalizeCatalogOptionalInteger,
  normalizeCatalogOptionalJsonObject,
  normalizeCatalogOptionalText,
  normalizeCatalogSearch,
  normalizeCatalogUuid,
  requireCatalogUpdateFields,
} from "../shared/inventoryCatalogValidation";

import type {
  InventoryVariantCreateData,
  InventoryVariantFilters,
  InventoryVariantUpdateData,
} from "./inventoryVariant.types";

const MAX_NAME_LENGTH = 160;
const MAX_SORT_ORDER = 1_000_000;

function validateMinimumAndMaximumStock(params: {
  minimumStock: string | undefined;
  maximumStock: string | null | undefined;
}) {
  if (
    params.minimumStock === undefined ||
    params.maximumStock === undefined ||
    params.maximumStock === null
  ) {
    return;
  }

  const minimumStock = new Prisma.Decimal(params.minimumStock);
  const maximumStock = new Prisma.Decimal(params.maximumStock);

  if (maximumStock.lessThan(minimumStock)) {
    throw new InventoryValidationError(
      "El inventario máximo no puede ser menor que el inventario mínimo.",
      {
        errors: {
          maximum_stock: "Debe ser igual o mayor que el inventario mínimo.",
        },
      },
    );
  }
}

export function normalizeInventoryVariantId(value: unknown) {
  return normalizeCatalogUuid(value, "El id de la variante");
}

export function normalizeInventoryVariantFilters(
  searchParams: URLSearchParams,
): InventoryVariantFilters {
  const activeOnly =
    normalizeCatalogOptionalBoolean(
      searchParams.get("active_only") ?? undefined,
      "El filtro activo",
    ) ?? true;

  const isDefault = normalizeCatalogOptionalBoolean(
    searchParams.get("is_default") ?? undefined,
    "El filtro de variante predeterminada",
  );

  const productIdValue = searchParams.get("product_id");
  const stockUnitIdValue = searchParams.get("stock_unit_id");

  return {
    activeOnly,
    isDefault,
    search: normalizeCatalogSearch(searchParams.get("search")),
    productId: productIdValue
      ? normalizeCatalogUuid(productIdValue, "El id del producto")
      : undefined,
    stockUnitId: stockUnitIdValue
      ? normalizeCatalogUuid(stockUnitIdValue, "El id de la unidad")
      : undefined,
  };
}

export function normalizeInventoryVariantCreateInput(
  input: unknown,
): InventoryVariantCreateData {
  const record = normalizeCatalogInputRecord(input);

  const minimumStock =
    normalizeCatalogDecimal(
      record.minimum_stock ?? "0",
      "El inventario mínimo",
      {
        precision: 18,
        scale: 6,
        required: true,
        minimum: "0",
      },
    ) ?? "0";

  const maximumStock = normalizeCatalogDecimal(
    record.maximum_stock,
    "El inventario máximo",
    {
      precision: 18,
      scale: 6,
      nullable: true,
      minimum: "0",
    },
  );

  validateMinimumAndMaximumStock({
    minimumStock,
    maximumStock,
  });

  return {
    stock_unit_id: normalizeCatalogUuid(
      record.stock_unit_id,
      "El id de la unidad de inventario",
    ),
    name: normalizeCatalogOptionalText(
      record.name,
      "El nombre de la variante",
      MAX_NAME_LENGTH,
    ),
    attributes: normalizeCatalogJsonObject(
      record.attributes,
      "Los atributos de la variante",
    ),
    default_cost:
      normalizeCatalogDecimal(record.default_cost, "El costo predeterminado", {
        precision: 14,
        scale: 4,
        nullable: true,
        minimum: "0",
      }) ?? null,
    default_price:
      normalizeCatalogDecimal(
        record.default_price,
        "El precio predeterminado",
        {
          precision: 14,
          scale: 2,
          nullable: true,
          minimum: "0",
        },
      ) ?? null,
    minimum_stock: minimumStock,
    maximum_stock: maximumStock ?? null,
    is_default:
      normalizeCatalogOptionalBoolean(
        record.is_default,
        "El indicador de variante predeterminada",
      ) ?? false,
    sort_order:
      normalizeCatalogOptionalInteger(record.sort_order, "El orden", {
        minimum: 0,
        maximum: MAX_SORT_ORDER,
      }) ?? 0,
  };
}

export function normalizeInventoryVariantUpdateInput(
  input: unknown,
): InventoryVariantUpdateData {
  const record = normalizeCatalogInputRecord(input);
  const data: InventoryVariantUpdateData = {};

  if (record.stock_unit_id !== undefined) {
    data.stock_unit_id = normalizeCatalogUuid(
      record.stock_unit_id,
      "El id de la unidad de inventario",
    );
  }

  if (record.name !== undefined) {
    data.name = normalizeCatalogOptionalText(
      record.name,
      "El nombre de la variante",
      MAX_NAME_LENGTH,
    );
  }

  if (record.attributes !== undefined) {
    data.attributes = normalizeCatalogOptionalJsonObject(
      record.attributes,
      "Los atributos de la variante",
    );
  }

  if (record.default_cost !== undefined) {
    data.default_cost = normalizeCatalogDecimal(
      record.default_cost,
      "El costo predeterminado",
      {
        precision: 14,
        scale: 4,
        nullable: true,
        minimum: "0",
      },
    );
  }

  if (record.default_price !== undefined) {
    data.default_price = normalizeCatalogDecimal(
      record.default_price,
      "El precio predeterminado",
      {
        precision: 14,
        scale: 2,
        nullable: true,
        minimum: "0",
      },
    );
  }

  if (record.minimum_stock !== undefined) {
    data.minimum_stock =
      normalizeCatalogDecimal(record.minimum_stock, "El inventario mínimo", {
        precision: 18,
        scale: 6,
        required: true,
        minimum: "0",
      }) ?? undefined;
  }

  if (record.maximum_stock !== undefined) {
    data.maximum_stock = normalizeCatalogDecimal(
      record.maximum_stock,
      "El inventario máximo",
      {
        precision: 18,
        scale: 6,
        nullable: true,
        minimum: "0",
      },
    );
  }

  if (record.is_default !== undefined) {
    data.is_default = normalizeCatalogOptionalBoolean(
      record.is_default,
      "El indicador de variante predeterminada",
    );
  }

  if (record.sort_order !== undefined) {
    data.sort_order = normalizeCatalogOptionalInteger(
      record.sort_order,
      "El orden",
      {
        minimum: 0,
        maximum: MAX_SORT_ORDER,
      },
    );
  }

  if (record.is_active !== undefined) {
    data.is_active = normalizeCatalogOptionalBoolean(
      record.is_active,
      "El estado de la variante",
    );
  }

  validateMinimumAndMaximumStock({
    minimumStock: data.minimum_stock,
    maximumStock: data.maximum_stock,
  });

  requireCatalogUpdateFields(data as Record<string, unknown>);

  return data;
}
