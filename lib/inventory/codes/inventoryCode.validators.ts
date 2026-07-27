import { InventoryCodeType } from "@prisma/client";

import { InventoryValidationError } from "../shared/inventoryErrors";

import {
  normalizeCatalogDecimal,
  normalizeCatalogEnum,
  normalizeCatalogInputRecord,
  normalizeCatalogOptionalBoolean,
  normalizeCatalogOptionalNullableUuid,
  normalizeCatalogOptionalText,
  normalizeCatalogRequiredText,
  normalizeCatalogSearch,
  normalizeCatalogUuid,
  requireCatalogUpdateFields,
} from "../shared/inventoryCatalogValidation";

import type {
  InventoryCodeCreateData,
  InventoryCodeFilters,
  InventoryCodeUpdateData,
} from "./inventoryCode.types";

const MAX_CODE_LENGTH = 255;
const MAX_LABEL_LENGTH = 160;

const CODE_TYPES = Object.values(InventoryCodeType);

function normalizeInventoryCodeType(value: unknown): InventoryCodeType {
  return normalizeCatalogEnum(value, "El tipo de código", CODE_TYPES);
}

function normalizeInventoryCodeValue(value: unknown) {
  const code = normalizeCatalogRequiredText(
    value,
    "El código",
    MAX_CODE_LENGTH,
  );

  if (/[\u0000-\u001F\u007F]/.test(code)) {
    throw new InventoryValidationError(
      "El código no puede contener saltos de línea ni caracteres de control.",
      {
        errors: {
          code: "Ingrese un código válido en una sola línea.",
        },
      },
    );
  }

  return code;
}

export function normalizeInventoryCodeId(value: unknown) {
  return normalizeCatalogUuid(value, "El id del código");
}

export function normalizeInventoryCodeFilters(
  searchParams: URLSearchParams,
): InventoryCodeFilters {
  const rawVariantId = searchParams.get("variant_id");

  const rawUnitOfMeasureId = searchParams.get("unit_of_measure_id");

  const rawCodeType = searchParams.get("code_type");

  return {
    search: normalizeCatalogSearch(searchParams.get("search")),
    activeOnly:
      normalizeCatalogOptionalBoolean(
        searchParams.get("active_only") ?? undefined,
        "El filtro activo",
      ) ?? true,
    variantId: rawVariantId
      ? normalizeCatalogUuid(rawVariantId, "El id de la variante")
      : undefined,
    unitOfMeasureId: rawUnitOfMeasureId
      ? normalizeCatalogUuid(rawUnitOfMeasureId, "El id de la unidad de medida")
      : undefined,
    codeType: rawCodeType ? normalizeInventoryCodeType(rawCodeType) : undefined,
    isPrimary: normalizeCatalogOptionalBoolean(
      searchParams.get("is_primary") ?? undefined,
      "El filtro de código principal",
    ),
    isScannable: normalizeCatalogOptionalBoolean(
      searchParams.get("is_scannable") ?? undefined,
      "El filtro de código escaneable",
    ),
  };
}

export function normalizeInventoryCodeCreateInput(
  input: unknown,
): InventoryCodeCreateData {
  const record = normalizeCatalogInputRecord(input);

  const quantityInStockUnit =
    normalizeCatalogDecimal(
      record.quantity_in_stock_unit ?? "1",
      "La cantidad en la unidad de inventario",
      {
        precision: 18,
        scale: 6,
        required: true,
        minimum: "0.000001",
      },
    ) ?? "1";

  return {
    unit_of_measure_id:
      normalizeCatalogOptionalNullableUuid(
        record.unit_of_measure_id,
        "El id de la unidad de medida",
      ) ?? null,
    code: normalizeInventoryCodeValue(record.code),
    code_type: normalizeInventoryCodeType(record.code_type),
    label: normalizeCatalogOptionalText(
      record.label,
      "La etiqueta",
      MAX_LABEL_LENGTH,
    ),
    quantity_in_stock_unit: quantityInStockUnit,
    is_primary:
      normalizeCatalogOptionalBoolean(
        record.is_primary,
        "El indicador de código principal",
      ) ?? false,
    is_scannable:
      normalizeCatalogOptionalBoolean(
        record.is_scannable,
        "El indicador de código escaneable",
      ) ?? true,
  };
}

export function normalizeInventoryCodeUpdateInput(
  input: unknown,
): InventoryCodeUpdateData {
  const record = normalizeCatalogInputRecord(input);
  const data: InventoryCodeUpdateData = {};

  if (record.unit_of_measure_id !== undefined) {
    data.unit_of_measure_id = normalizeCatalogOptionalNullableUuid(
      record.unit_of_measure_id,
      "El id de la unidad de medida",
    );
  }

  if (record.code !== undefined) {
    data.code = normalizeInventoryCodeValue(record.code);
  }

  if (record.code_type !== undefined) {
    data.code_type = normalizeInventoryCodeType(record.code_type);
  }

  if (record.label !== undefined) {
    data.label = normalizeCatalogOptionalText(
      record.label,
      "La etiqueta",
      MAX_LABEL_LENGTH,
    );
  }

  if (record.quantity_in_stock_unit !== undefined) {
    data.quantity_in_stock_unit =
      normalizeCatalogDecimal(
        record.quantity_in_stock_unit,
        "La cantidad en la unidad de inventario",
        {
          precision: 18,
          scale: 6,
          required: true,
          minimum: "0.000001",
        },
      ) ?? undefined;
  }

  if (record.is_primary !== undefined) {
    data.is_primary = normalizeCatalogOptionalBoolean(
      record.is_primary,
      "El indicador de código principal",
    );
  }

  if (record.is_scannable !== undefined) {
    data.is_scannable = normalizeCatalogOptionalBoolean(
      record.is_scannable,
      "El indicador de código escaneable",
    );
  }

  if (record.is_active !== undefined) {
    data.is_active = normalizeCatalogOptionalBoolean(
      record.is_active,
      "El estado del código",
    );
  }

  requireCatalogUpdateFields(data as Record<string, unknown>);

  return data;
}
