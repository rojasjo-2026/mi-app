import {
  InventoryDocumentStatus,
  type InventoryDocumentType,
} from "@prisma/client";

import {
  InventoryValidationError,
  isPrismaRecordNotFoundError,
  isPrismaUniqueConstraintError,
} from "../shared/inventoryErrors";

import type {
  InventoryFieldErrors,
  InventoryServiceResult,
} from "../shared/inventoryServiceResult.types";

import {
  mapInventoryDocumentDetail,
  mapInventoryDocuments,
} from "./inventoryDocument.mapper";

import {
  createInventoryDocumentRecord,
  findInventoryDocumentById,
  findInventoryDocumentByIdempotencyKey,
  findInventoryDocumentDetailById,
  findInventoryDocumentLocationById,
  countInventoryDocuments,
  findInventoryDocuments,
  updateInventoryDocumentRecord,
} from "./inventoryDocument.repository";

import type {
  InventoryDocumentDetailResponse,
  InventoryDocumentListResponse,
  InventoryDocumentResponse,
} from "./inventoryDocument.types";

import {
  normalizeInventoryDocumentCreateInput,
  normalizeInventoryDocumentQuery,
  normalizeInventoryDocumentId,
  normalizeInventoryDocumentUpdateInput,
  validateInventoryDocumentLocationRules,
} from "./inventoryDocument.validators";

import { generateInventoryDocumentNumber } from "./inventoryDocumentNumber";

function successResult<T>(
  status: number,
  data: T,
  message?: string,
): InventoryServiceResult<T> {
  return {
    status,
    body: {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
  };
}

function errorResult<T>(
  status: number,
  message: string,
  errors?: InventoryFieldErrors,
): InventoryServiceResult<T> {
  return {
    status,
    body: {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    },
  };
}

function handleDocumentServiceError<T>(
  error: unknown,
  context: string,
): InventoryServiceResult<T> {
  if (error instanceof InventoryValidationError) {
    return errorResult(error.status, error.message, error.errors);
  }

  if (isPrismaRecordNotFoundError(error)) {
    return errorResult(404, "No se encontró el documento de inventario.");
  }

  if (isPrismaUniqueConstraintError(error)) {
    return errorResult(
      409,
      "Ya existe un documento con la misma información única.",
    );
  }

  console.error(context, error);

  return errorResult(
    500,
    "Ocurrió un error interno al procesar el documento de inventario.",
  );
}

async function validateDocumentLocation(
  inventoryLocationId: string | null,
  field: "source_location_id" | "destination_location_id",
  label: string,
) {
  if (!inventoryLocationId) {
    return;
  }

  const location = await findInventoryDocumentLocationById(inventoryLocationId);

  if (!location) {
    throw new InventoryValidationError(`No se encontró ${label}.`, {
      status: 404,
      errors: {
        [field]: "La ubicación indicada no existe.",
      },
    });
  }

  if (!location.is_active) {
    throw new InventoryValidationError(`${label} está desactivada.`, {
      status: 409,
      errors: {
        [field]: "Seleccione una ubicación activa.",
      },
    });
  }

  if (!location.allows_stock) {
    throw new InventoryValidationError(
      `${label} no está habilitada para almacenar inventario.`,
      {
        status: 409,
        errors: {
          [field]: "Seleccione una ubicación que permita existencias.",
        },
      },
    );
  }
}

async function validateDocumentLocations(
  sourceLocationId: string | null,
  destinationLocationId: string | null,
) {
  await Promise.all([
    validateDocumentLocation(
      sourceLocationId,
      "source_location_id",
      "La ubicación de origen",
    ),
    validateDocumentLocation(
      destinationLocationId,
      "destination_location_id",
      "La ubicación de destino",
    ),
  ]);
}

async function getRequiredDocumentDetail(inventoryDocumentId: string) {
  const document = await findInventoryDocumentDetailById(inventoryDocumentId);

  if (!document) {
    throw new InventoryValidationError(
      "No se encontró el documento de inventario.",
      {
        status: 404,
      },
    );
  }

  return document;
}

export async function getInventoryDocumentsFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<InventoryDocumentResponse[]>> {
  try {
    const filters = normalizeInventoryDocumentQuery(searchParams);

    const documents = await findInventoryDocuments(filters);

    return successResult(200, mapInventoryDocuments(documents));
  } catch (error) {
    return handleDocumentServiceError(error, "GET inventory documents error:");
  }
}

export async function getInventoryDocumentById(
  inventoryDocumentId: unknown,
): Promise<InventoryServiceResult<InventoryDocumentDetailResponse>> {
  try {
    const normalizedId = normalizeInventoryDocumentId(inventoryDocumentId);

    const document = await getRequiredDocumentDetail(normalizedId);

    return successResult(200, mapInventoryDocumentDetail(document));
  } catch (error) {
    return handleDocumentServiceError(
      error,
      "GET inventory document detail error:",
    );
  }
}

export async function createInventoryDocument(
  input: unknown,
): Promise<InventoryServiceResult<InventoryDocumentDetailResponse>> {
  try {
    const data = normalizeInventoryDocumentCreateInput(input);

    await validateDocumentLocations(
      data.source_location_id,
      data.destination_location_id,
    );

    if (data.idempotency_key) {
      const existingDocument = await findInventoryDocumentByIdempotencyKey(
        data.idempotency_key,
      );

      if (existingDocument) {
        return successResult(
          200,
          mapInventoryDocumentDetail(existingDocument),
          "El documento ya había sido creado con la misma llave de idempotencia.",
        );
      }
    }

    try {
      const createdDocument = await createInventoryDocumentRecord(
        generateInventoryDocumentNumber(data.document_type, data.document_date),
        data,
      );

      const document = await getRequiredDocumentDetail(
        createdDocument.inventory_document_id,
      );

      return successResult(
        201,
        mapInventoryDocumentDetail(document),
        "Documento de inventario creado correctamente.",
      );
    } catch (error) {
      if (isPrismaUniqueConstraintError(error) && data.idempotency_key) {
        const existingDocument = await findInventoryDocumentByIdempotencyKey(
          data.idempotency_key,
        );

        if (existingDocument) {
          return successResult(
            200,
            mapInventoryDocumentDetail(existingDocument),
            "El documento ya había sido creado con la misma llave de idempotencia.",
          );
        }
      }

      throw error;
    }
  } catch (error) {
    return handleDocumentServiceError(error, "POST inventory document error:");
  }
}

export async function updateInventoryDocument(
  inventoryDocumentId: unknown,
  input: unknown,
): Promise<InventoryServiceResult<InventoryDocumentDetailResponse>> {
  try {
    const normalizedId = normalizeInventoryDocumentId(inventoryDocumentId);

    const existingDocument = await findInventoryDocumentById(normalizedId);

    if (!existingDocument) {
      throw new InventoryValidationError(
        "No se encontró el documento de inventario.",
        {
          status: 404,
        },
      );
    }

    if (existingDocument.status !== InventoryDocumentStatus.DRAFT) {
      throw new InventoryValidationError(
        "Solo los documentos en borrador pueden modificarse.",
        {
          status: 409,
        },
      );
    }

    const data = normalizeInventoryDocumentUpdateInput(input);

    if (
      data.document_type !== undefined &&
      data.document_type !== existingDocument.document_type
    ) {
      throw new InventoryValidationError(
        "El tipo de documento no puede cambiarse después de su creación.",
        {
          status: 409,
          errors: {
            document_type: "Cree un documento nuevo para utilizar otro tipo.",
          },
        },
      );
    }

    const documentType: InventoryDocumentType = existingDocument.document_type;

    const sourceLocationId =
      data.source_location_id !== undefined
        ? data.source_location_id
        : existingDocument.source_location_id;

    const destinationLocationId =
      data.destination_location_id !== undefined
        ? data.destination_location_id
        : existingDocument.destination_location_id;

    validateInventoryDocumentLocationRules(
      documentType,
      sourceLocationId,
      destinationLocationId,
    );

    await validateDocumentLocations(sourceLocationId, destinationLocationId);

    await updateInventoryDocumentRecord(normalizedId, data);

    const updatedDocument = await getRequiredDocumentDetail(normalizedId);

    return successResult(
      200,
      mapInventoryDocumentDetail(updatedDocument),
      "Documento de inventario actualizado correctamente.",
    );
  } catch (error) {
    return handleDocumentServiceError(error, "PATCH inventory document error:");
  }
}
