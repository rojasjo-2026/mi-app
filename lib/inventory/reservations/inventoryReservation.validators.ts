import {
  normalizeCatalogDecimal,
  normalizeCatalogInputRecord,
  normalizeCatalogOptionalText,
  normalizeCatalogUuid,
} from "../shared/inventoryCatalogValidation";

import { InventoryValidationError } from "../shared/inventoryErrors";

import type {
  InventoryReservationCreateData,
  InventoryReservationCreateLineData,
} from "./inventoryReservation.types";

const MAX_REFERENCE_TYPE_LENGTH = 80;
const MAX_REFERENCE_ID_LENGTH = 160;
const MAX_REFERENCE_NUMBER_LENGTH = 160;
const MAX_IDEMPOTENCY_KEY_LENGTH = 200;
const MAX_NOTES_LENGTH = 2_000;
const MAX_LINE_NOTES_LENGTH = 2_000;
const MAX_USER_LENGTH = 160;
const MAX_LINES = 200;

function normalizeOptionalExpirationDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const expirationDate =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(String(value).trim());

  if (Number.isNaN(expirationDate.getTime())) {
    throw new InventoryValidationError(
      "La fecha de vencimiento no es vÃ¡lida.",
      {
        errors: {
          expires_at: "Indique una fecha vÃ¡lida.",
        },
      },
    );
  }

  if (expirationDate.getTime() <= Date.now()) {
    throw new InventoryValidationError(
      "La fecha de vencimiento debe ser futura.",
      {
        errors: {
          expires_at: "Indique una fecha posterior al momento actual.",
        },
      },
    );
  }

  return expirationDate;
}

function normalizeReservationLine(
  value: unknown,
  index: number,
): InventoryReservationCreateLineData {
  const lineNumber = index + 1;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InventoryValidationError(
      `La lÃ­nea ${lineNumber} no es vÃ¡lida.`,
      {
        errors: {
          [`lines.${index}`]: "La lÃ­nea debe ser un objeto.",
        },
      },
    );
  }

  const record = value as Record<string, unknown>;

  const quantityRequested = normalizeCatalogDecimal(
    record.quantity_requested,
    `La cantidad solicitada de la lÃ­nea ${lineNumber}`,
    {
      precision: 18,
      scale: 6,
      required: true,
      minimum: "0.000001",
    },
  );

  if (typeof quantityRequested !== "string") {
    throw new InventoryValidationError(
      `La cantidad solicitada de la lÃ­nea ${lineNumber} es requerida.`,
      {
        errors: {
          [`lines.${index}.quantity_requested`]:
            "Indique una cantidad mayor que cero.",
        },
      },
    );
  }

  return {
    inventory_product_variant_id: normalizeCatalogUuid(
      record.inventory_product_variant_id,
      `La variante de la lÃ­nea ${lineNumber}`,
    ),
    inventory_location_id: normalizeCatalogUuid(
      record.inventory_location_id,
      `La ubicaciÃ³n de la lÃ­nea ${lineNumber}`,
    ),
    quantity_requested: quantityRequested,
    notes: normalizeCatalogOptionalText(
      record.notes,
      `Las notas de la lÃ­nea ${lineNumber}`,
      MAX_LINE_NOTES_LENGTH,
    ),
  };
}

function normalizeReservationLines(
  value: unknown,
): InventoryReservationCreateLineData[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InventoryValidationError(
      "La reserva debe contener al menos una lÃ­nea.",
      {
        errors: {
          lines: "Agregue al menos una lÃ­nea a la reserva.",
        },
      },
    );
  }

  if (value.length > MAX_LINES) {
    throw new InventoryValidationError(
      `La reserva no puede superar ${MAX_LINES} lÃ­neas.`,
      {
        errors: {
          lines: `El mÃ¡ximo permitido es de ${MAX_LINES} lÃ­neas.`,
        },
      },
    );
  }

  const lines = value.map(normalizeReservationLine);
  const uniquePairs = new Set<string>();

  for (const [index, line] of lines.entries()) {
    const pairKey = [
      line.inventory_product_variant_id,
      line.inventory_location_id,
    ].join(":");

    if (uniquePairs.has(pairKey)) {
      throw new InventoryValidationError(
        "La reserva contiene lÃ­neas duplicadas.",
        {
          errors: {
            [`lines.${index}`]:
              "La misma variante y ubicaciÃ³n solo pueden aparecer una vez.",
          },
        },
      );
    }

    uniquePairs.add(pairKey);
  }

  return lines;
}

export function normalizeInventoryReservationCreateInput(
  input: unknown,
): InventoryReservationCreateData {
  const record = normalizeCatalogInputRecord(input);

  return {
    reference_type: normalizeCatalogOptionalText(
      record.reference_type,
      "El tipo de referencia",
      MAX_REFERENCE_TYPE_LENGTH,
    ),
    reference_id: normalizeCatalogOptionalText(
      record.reference_id,
      "El identificador de referencia",
      MAX_REFERENCE_ID_LENGTH,
    ),
    reference_number: normalizeCatalogOptionalText(
      record.reference_number,
      "El nÃºmero de referencia",
      MAX_REFERENCE_NUMBER_LENGTH,
    ),
    idempotency_key: normalizeCatalogOptionalText(
      record.idempotency_key,
      "La llave de idempotencia",
      MAX_IDEMPOTENCY_KEY_LENGTH,
    ),
    expires_at: normalizeOptionalExpirationDate(record.expires_at),
    notes: normalizeCatalogOptionalText(
      record.notes,
      "Las notas",
      MAX_NOTES_LENGTH,
    ),
    created_by: normalizeCatalogOptionalText(
      record.created_by,
      "El usuario creador",
      MAX_USER_LENGTH,
    ),
    lines: normalizeReservationLines(record.lines),
  };
}
