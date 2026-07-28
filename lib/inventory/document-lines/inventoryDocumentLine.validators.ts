import {
  normalizeCatalogDecimal,
  normalizeCatalogInputRecord,
  normalizeCatalogOptionalNullableUuid,
  normalizeCatalogOptionalText,
  normalizeCatalogUuid,
  requireCatalogUpdateFields,
} from "../shared/inventoryCatalogValidation";

import type {
  InventoryDocumentLineCreateInputData,
  InventoryDocumentLineUpdateInputData,
} from "./inventoryDocumentLine.types";

const MAX_NOTES_LENGTH = 1_000;

export function normalizeInventoryDocumentLineId(value: unknown) {
  return normalizeCatalogUuid(value, "El id de la línea");
}

export function normalizeInventoryDocumentLineCreateInput(
  input: unknown,
): InventoryDocumentLineCreateInputData {
  const record = normalizeCatalogInputRecord(input);

  return {
    inventory_product_variant_id: normalizeCatalogUuid(
      record.inventory_product_variant_id,
      "El id de la variante",
    ),
    inventory_product_code_id:
      normalizeCatalogOptionalNullableUuid(
        record.inventory_product_code_id,
        "El id del código",
      ) ?? null,
    unit_of_measure_id: normalizeCatalogUuid(
      record.unit_of_measure_id,
      "El id de la unidad de medida",
    ),
    quantity:
      normalizeCatalogDecimal(record.quantity, "La cantidad", {
        precision: 18,
        scale: 6,
        required: true,
        minimum: "0.000001",
      }) ?? "0",
    conversion_factor:
      normalizeCatalogDecimal(
        record.conversion_factor ?? "1",
        "El factor de conversión",
        {
          precision: 18,
          scale: 6,
          required: true,
          minimum: "0.000001",
        },
      ) ?? "1",
    unit_cost:
      normalizeCatalogDecimal(record.unit_cost ?? "0", "El costo unitario", {
        precision: 14,
        scale: 4,
        required: true,
        minimum: "0",
      }) ?? "0",
    notes: normalizeCatalogOptionalText(
      record.notes,
      "Las notas de la línea",
      MAX_NOTES_LENGTH,
    ),
  };
}

export function normalizeInventoryDocumentLineUpdateInput(
  input: unknown,
): InventoryDocumentLineUpdateInputData {
  const record = normalizeCatalogInputRecord(input);

  const data: InventoryDocumentLineUpdateInputData = {};

  if (record.inventory_product_variant_id !== undefined) {
    data.inventory_product_variant_id = normalizeCatalogUuid(
      record.inventory_product_variant_id,
      "El id de la variante",
    );
  }

  if (record.inventory_product_code_id !== undefined) {
    data.inventory_product_code_id = normalizeCatalogOptionalNullableUuid(
      record.inventory_product_code_id,
      "El id del código",
    );
  }

  if (record.unit_of_measure_id !== undefined) {
    data.unit_of_measure_id = normalizeCatalogUuid(
      record.unit_of_measure_id,
      "El id de la unidad de medida",
    );
  }

  if (record.quantity !== undefined) {
    data.quantity =
      normalizeCatalogDecimal(record.quantity, "La cantidad", {
        precision: 18,
        scale: 6,
        required: true,
        minimum: "0.000001",
      }) ?? undefined;
  }

  if (record.conversion_factor !== undefined) {
    data.conversion_factor =
      normalizeCatalogDecimal(
        record.conversion_factor,
        "El factor de conversión",
        {
          precision: 18,
          scale: 6,
          required: true,
          minimum: "0.000001",
        },
      ) ?? undefined;
  }

  if (record.unit_cost !== undefined) {
    data.unit_cost =
      normalizeCatalogDecimal(record.unit_cost, "El costo unitario", {
        precision: 14,
        scale: 4,
        required: true,
        minimum: "0",
      }) ?? undefined;
  }

  if (record.notes !== undefined) {
    data.notes = normalizeCatalogOptionalText(
      record.notes,
      "Las notas de la línea",
      MAX_NOTES_LENGTH,
    );
  }

  requireCatalogUpdateFields(data as Record<string, unknown>);

  return data;
}
