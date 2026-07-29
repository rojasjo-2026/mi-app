import {
  normalizeCatalogDecimal,
  normalizeCatalogInputRecord,
  normalizeCatalogOptionalText,
  normalizeCatalogUuid,
} from "../shared/inventoryCatalogValidation";

import { InventoryValidationError } from "../shared/inventoryErrors";

import {
  InventoryReservationConsumptionError,
  type InventoryReservationConsumptionInput,
  type InventoryReservationConsumptionLineInput,
} from "./inventoryReservationConsumption.types";

const MAX_IDEMPOTENCY_KEY_LENGTH = 200;

const MAX_CONSUMPTION_REASON_LENGTH = 2_000;

const MAX_USER_LENGTH = 160;

const MAX_LINES = 200;

function convertValidationError(
  error: unknown,
  code:
    | "INVALID_RESERVATION_ID"
    | "INVALID_REQUEST_BODY"
    | "INVALID_IDEMPOTENCY_KEY"
    | "INVALID_CONSUMPTION_REASON"
    | "INVALID_CONSUMED_BY"
    | "INVALID_LINE_ID"
    | "INVALID_QUANTITY",
): never {
  if (error instanceof InventoryValidationError) {
    throw new InventoryReservationConsumptionError(
      code,
      error.message,
      error.errors,
    );
  }

  throw error;
}

function normalizeRequiredText(
  value: unknown,
  fieldLabel: string,
  fieldName: string,
  maximumLength: number,
  code: "INVALID_IDEMPOTENCY_KEY" | "INVALID_CONSUMPTION_REASON",
) {
  try {
    const normalized = normalizeCatalogOptionalText(
      value,
      fieldLabel,
      maximumLength,
    );

    if (!normalized) {
      throw new InventoryReservationConsumptionError(
        code,
        `${fieldLabel} es requerido.`,
        {
          [fieldName]: `Ingrese ${fieldLabel.toLowerCase()}.`,
        },
      );
    }

    return normalized;
  } catch (error) {
    if (error instanceof InventoryReservationConsumptionError) {
      throw error;
    }

    convertValidationError(error, code);
  }
}

function normalizeConsumptionLine(
  value: unknown,
  index: number,
): InventoryReservationConsumptionLineInput {
  const lineNumber = index + 1;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InventoryReservationConsumptionError(
      "INVALID_LINES",
      `La lÃƒÂ­nea ${lineNumber} no es vÃƒÂ¡lida.`,
      {
        [`lines.${index}`]: "La lÃƒÂ­nea debe ser un objeto.",
      },
    );
  }

  const record = value as Record<string, unknown>;

  let inventoryReservationLineId: string;

  try {
    inventoryReservationLineId = normalizeCatalogUuid(
      record.inventory_reservation_line_id,
      `La lÃƒÂ­nea de reserva ${lineNumber}`,
    );
  } catch (error) {
    convertValidationError(error, "INVALID_LINE_ID");
  }

  let quantity: string | null | undefined;

  try {
    quantity = normalizeCatalogDecimal(
      record.quantity,
      `La cantidad de la lÃƒÂ­nea ${lineNumber}`,
      {
        precision: 18,
        scale: 6,
        required: true,
        minimum: "0.000001",
      },
    );
  } catch (error) {
    convertValidationError(error, "INVALID_QUANTITY");
  }

  if (typeof quantity !== "string") {
    throw new InventoryReservationConsumptionError(
      "INVALID_QUANTITY",
      `La cantidad de la lÃƒÂ­nea ${lineNumber} es requerida.`,
      {
        [`lines.${index}.quantity`]: "Ingrese una cantidad mayor que cero.",
      },
    );
  }

  return {
    inventoryReservationLineId,
    quantity,
  };
}

function normalizeConsumptionLines(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InventoryReservationConsumptionError(
      "INVALID_LINES",
      "El consumo debe contener al menos una lÃƒÂ­nea.",
      {
        lines: "Agregue al menos una lÃƒÂ­nea para consumir.",
      },
    );
  }

  if (value.length > MAX_LINES) {
    throw new InventoryReservationConsumptionError(
      "INVALID_LINES",
      `El consumo no puede superar ${MAX_LINES} lÃƒÂ­neas.`,
      {
        lines: `El mÃƒÂ¡ximo permitido es de ${MAX_LINES} lÃƒÂ­neas.`,
      },
    );
  }

  const lines = value.map(normalizeConsumptionLine);

  const uniqueLineIds = new Set<string>();

  for (const [index, line] of lines.entries()) {
    if (uniqueLineIds.has(line.inventoryReservationLineId)) {
      throw new InventoryReservationConsumptionError(
        "INVALID_LINES",
        "El consumo contiene lÃƒÂ­neas duplicadas.",
        {
          [`lines.${index}.inventory_reservation_line_id`]:
            "Cada lÃƒÂ­nea de reserva solo puede aparecer una vez.",
        },
      );
    }

    uniqueLineIds.add(line.inventoryReservationLineId);
  }

  return lines;
}

export function normalizeInventoryReservationConsumptionId(value: unknown) {
  try {
    return normalizeCatalogUuid(value, "El identificador de la reserva");
  } catch (error) {
    convertValidationError(error, "INVALID_RESERVATION_ID");
  }
}

export function normalizeInventoryReservationConsumptionInput(
  value: unknown,
): InventoryReservationConsumptionInput {
  let record: Record<string, unknown>;

  try {
    record = normalizeCatalogInputRecord(value);
  } catch (error) {
    convertValidationError(error, "INVALID_REQUEST_BODY");
  }

  let consumedBy: string | null;

  try {
    consumedBy = normalizeCatalogOptionalText(
      record.consumed_by,
      "El usuario que registra el consumo",
      MAX_USER_LENGTH,
    );
  } catch (error) {
    convertValidationError(error, "INVALID_CONSUMED_BY");
  }

  return {
    idempotencyKey: normalizeRequiredText(
      record.idempotency_key,
      "La llave de idempotencia",
      "idempotency_key",
      MAX_IDEMPOTENCY_KEY_LENGTH,
      "INVALID_IDEMPOTENCY_KEY",
    ),

    consumptionReason: normalizeRequiredText(
      record.consumption_reason,
      "El motivo del consumo",
      "consumption_reason",
      MAX_CONSUMPTION_REASON_LENGTH,
      "INVALID_CONSUMPTION_REASON",
    ),

    consumedBy,

    lines: normalizeConsumptionLines(record.lines),
  };
}
