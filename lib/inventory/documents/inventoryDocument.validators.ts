import { InventoryDocumentStatus, InventoryDocumentType } from "@prisma/client";

import { InventoryValidationError } from "../shared/inventoryErrors";

import {
  normalizeCatalogEnum,
  normalizeCatalogInputRecord,
  normalizeCatalogNullableUuid,
  normalizeCatalogOptionalNullableUuid,
  normalizeCatalogOptionalText,
  normalizeCatalogSearch,
  normalizeCatalogUuid,
  requireCatalogUpdateFields,
} from "../shared/inventoryCatalogValidation";

import type {
  InventoryDocumentCreateData,
  InventoryDocumentFilters,
  InventoryDocumentUpdateData,
} from "./inventoryDocument.types";

const DOCUMENT_TYPES = Object.values(InventoryDocumentType);

const DOCUMENT_STATUSES = Object.values(InventoryDocumentStatus);

const MAX_REFERENCE_TYPE_LENGTH = 80;
const MAX_REFERENCE_ID_LENGTH = 160;
const MAX_REFERENCE_NUMBER_LENGTH = 160;
const MAX_IDEMPOTENCY_KEY_LENGTH = 200;
const MAX_NOTES_LENGTH = 2_000;
const MAX_USER_LENGTH = 160;

function normalizeDocumentType(value: unknown) {
  return normalizeCatalogEnum(value, "El tipo de documento", DOCUMENT_TYPES);
}

function normalizeDocumentStatus(value: unknown) {
  return normalizeCatalogEnum(
    value,
    "El estado del documento",
    DOCUMENT_STATUSES,
  );
}

function normalizeDateValue(value: unknown, fieldLabel: string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new InventoryValidationError(`${fieldLabel} no es válida.`);
    }

    return value;
  }

  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    throw new InventoryValidationError(`${fieldLabel} es requerida.`);
  }

  const date = new Date(cleanValue);

  if (Number.isNaN(date.getTime())) {
    throw new InventoryValidationError(`${fieldLabel} no es válida.`);
  }

  return date;
}

function normalizeOptionalDate(
  value: string | null,
  fieldLabel: string,
  endOfDay = false,
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);

  const normalizedValue = isDateOnly
    ? `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    : value;

  return normalizeDateValue(normalizedValue, fieldLabel);
}

export function validateInventoryDocumentLocationRules(
  documentType: InventoryDocumentType,
  sourceLocationId: string | null,
  destinationLocationId: string | null,
) {
  const inboundTypes: InventoryDocumentType[] = [
    InventoryDocumentType.OPENING_BALANCE,
    InventoryDocumentType.RECEIPT,
    InventoryDocumentType.ADJUSTMENT_INCREASE,
    InventoryDocumentType.RETURN_IN,
  ];

  const outboundTypes: InventoryDocumentType[] = [
    InventoryDocumentType.ISSUE,
    InventoryDocumentType.ADJUSTMENT_DECREASE,
    InventoryDocumentType.RETURN_OUT,
  ];

  if (documentType === InventoryDocumentType.TRANSFER) {
    if (!sourceLocationId) {
      throw new InventoryValidationError(
        "La ubicación de origen es requerida para una transferencia.",
        {
          errors: {
            source_location_id: "Seleccione la ubicación de origen.",
          },
        },
      );
    }

    if (!destinationLocationId) {
      throw new InventoryValidationError(
        "La ubicación de destino es requerida para una transferencia.",
        {
          errors: {
            destination_location_id: "Seleccione la ubicación de destino.",
          },
        },
      );
    }

    if (sourceLocationId === destinationLocationId) {
      throw new InventoryValidationError(
        "Las ubicaciones de origen y destino deben ser diferentes.",
        {
          errors: {
            destination_location_id: "Seleccione una ubicación diferente.",
          },
        },
      );
    }

    return;
  }

  if (inboundTypes.includes(documentType)) {
    if (!destinationLocationId) {
      throw new InventoryValidationError(
        "La ubicación de destino es requerida para este documento.",
        {
          errors: {
            destination_location_id:
              "Seleccione la ubicación que recibirá el inventario.",
          },
        },
      );
    }

    if (sourceLocationId) {
      throw new InventoryValidationError(
        "Este tipo de documento no utiliza una ubicación interna de origen.",
        {
          errors: {
            source_location_id: "Elimine la ubicación de origen.",
          },
        },
      );
    }

    return;
  }

  if (outboundTypes.includes(documentType)) {
    if (!sourceLocationId) {
      throw new InventoryValidationError(
        "La ubicación de origen es requerida para este documento.",
        {
          errors: {
            source_location_id:
              "Seleccione la ubicación desde donde saldrá el inventario.",
          },
        },
      );
    }

    if (destinationLocationId) {
      throw new InventoryValidationError(
        "Este tipo de documento no utiliza una ubicación interna de destino.",
        {
          errors: {
            destination_location_id: "Elimine la ubicación de destino.",
          },
        },
      );
    }
  }
}

export function normalizeInventoryDocumentId(value: unknown) {
  return normalizeCatalogUuid(value, "El id del documento");
}

export function normalizeInventoryDocumentFilters(
  searchParams: URLSearchParams,
): InventoryDocumentFilters {
  const rawDocumentType = searchParams.get("document_type");

  const rawStatus = searchParams.get("status");

  const dateFrom = normalizeOptionalDate(
    searchParams.get("date_from"),
    "La fecha inicial",
  );

  const dateTo = normalizeOptionalDate(
    searchParams.get("date_to"),
    "La fecha final",
    true,
  );

  if (dateFrom && dateTo && dateFrom.getTime() > dateTo.getTime()) {
    throw new InventoryValidationError(
      "La fecha inicial no puede ser posterior a la fecha final.",
    );
  }

  const sourceLocation = searchParams.get("source_location_id");

  const destinationLocation = searchParams.get("destination_location_id");

  return {
    search: normalizeCatalogSearch(searchParams.get("search")),
    documentType: rawDocumentType
      ? normalizeDocumentType(rawDocumentType)
      : undefined,
    status: rawStatus ? normalizeDocumentStatus(rawStatus) : undefined,
    sourceLocationId: sourceLocation
      ? normalizeCatalogUuid(sourceLocation, "El id de la ubicación de origen")
      : undefined,
    destinationLocationId: destinationLocation
      ? normalizeCatalogUuid(
          destinationLocation,
          "El id de la ubicación de destino",
        )
      : undefined,
    dateFrom,
    dateTo,
  };
}

export function normalizeInventoryDocumentCreateInput(
  input: unknown,
): InventoryDocumentCreateData {
  const record = normalizeCatalogInputRecord(input);

  const documentType = normalizeDocumentType(record.document_type);

  const sourceLocationId = normalizeCatalogNullableUuid(
    record.source_location_id,
    "El id de la ubicación de origen",
  );

  const destinationLocationId = normalizeCatalogNullableUuid(
    record.destination_location_id,
    "El id de la ubicación de destino",
  );

  validateInventoryDocumentLocationRules(
    documentType,
    sourceLocationId,
    destinationLocationId,
  );

  return {
    document_type: documentType,
    source_location_id: sourceLocationId,
    destination_location_id: destinationLocationId,
    document_date:
      record.document_date === undefined
        ? new Date()
        : normalizeDateValue(record.document_date, "La fecha del documento"),
    reference_type: normalizeCatalogOptionalText(
      record.reference_type,
      "El tipo de referencia",
      MAX_REFERENCE_TYPE_LENGTH,
    ),
    reference_id: normalizeCatalogOptionalText(
      record.reference_id,
      "El id de referencia",
      MAX_REFERENCE_ID_LENGTH,
    ),
    reference_number: normalizeCatalogOptionalText(
      record.reference_number,
      "El número de referencia",
      MAX_REFERENCE_NUMBER_LENGTH,
    ),
    idempotency_key: normalizeCatalogOptionalText(
      record.idempotency_key,
      "La llave de idempotencia",
      MAX_IDEMPOTENCY_KEY_LENGTH,
    ),
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
  };
}

export function normalizeInventoryDocumentUpdateInput(
  input: unknown,
): InventoryDocumentUpdateData {
  const record = normalizeCatalogInputRecord(input);

  const data: InventoryDocumentUpdateData = {};

  if (record.document_type !== undefined) {
    data.document_type = normalizeDocumentType(record.document_type);
  }

  if (record.source_location_id !== undefined) {
    data.source_location_id = normalizeCatalogOptionalNullableUuid(
      record.source_location_id,
      "El id de la ubicación de origen",
    );
  }

  if (record.destination_location_id !== undefined) {
    data.destination_location_id = normalizeCatalogOptionalNullableUuid(
      record.destination_location_id,
      "El id de la ubicación de destino",
    );
  }

  if (record.document_date !== undefined) {
    data.document_date = normalizeDateValue(
      record.document_date,
      "La fecha del documento",
    );
  }

  if (record.reference_type !== undefined) {
    data.reference_type = normalizeCatalogOptionalText(
      record.reference_type,
      "El tipo de referencia",
      MAX_REFERENCE_TYPE_LENGTH,
    );
  }

  if (record.reference_id !== undefined) {
    data.reference_id = normalizeCatalogOptionalText(
      record.reference_id,
      "El id de referencia",
      MAX_REFERENCE_ID_LENGTH,
    );
  }

  if (record.reference_number !== undefined) {
    data.reference_number = normalizeCatalogOptionalText(
      record.reference_number,
      "El número de referencia",
      MAX_REFERENCE_NUMBER_LENGTH,
    );
  }

  if (record.notes !== undefined) {
    data.notes = normalizeCatalogOptionalText(
      record.notes,
      "Las notas",
      MAX_NOTES_LENGTH,
    );
  }

  if (record.created_by !== undefined) {
    data.created_by = normalizeCatalogOptionalText(
      record.created_by,
      "El usuario creador",
      MAX_USER_LENGTH,
    );
  }

  requireCatalogUpdateFields(data as Record<string, unknown>);

  return data;
}
