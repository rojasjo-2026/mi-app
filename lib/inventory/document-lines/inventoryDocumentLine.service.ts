import { InventoryDocumentStatus } from "@prisma/client";

import {
  InventoryValidationError,
  isPrismaRecordNotFoundError,
} from "../shared/inventoryErrors";

import type {
  InventoryFieldErrors,
  InventoryServiceResult,
} from "../shared/inventoryServiceResult.types";

import { findInventoryDocumentById } from "../documents/inventoryDocument.repository";

import { normalizeInventoryDocumentId } from "../documents/inventoryDocument.validators";

import { mapInventoryDocumentLine } from "./inventoryDocumentLine.mapper";

import {
  createInventoryDocumentLineRecord,
  deleteInventoryDocumentLineRecord,
  findInventoryDocumentLineById,
  findInventoryDocumentLineDetailById,
  updateInventoryDocumentLineRecord,
} from "./inventoryDocumentLine.repository";

import { resolveInventoryDocumentLineData } from "./inventoryDocumentLineResolver";

import type {
  InventoryDocumentLineCreateInputData,
  InventoryDocumentLineResponse,
} from "./inventoryDocumentLine.types";

import {
  normalizeInventoryDocumentLineCreateInput,
  normalizeInventoryDocumentLineId,
  normalizeInventoryDocumentLineUpdateInput,
} from "./inventoryDocumentLine.validators";

type DeletedInventoryDocumentLineResponse = {
  inventory_document_line_id: string;
  inventory_document_id: string;
  deleted: true;
};

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

function handleDocumentLineServiceError<T>(
  error: unknown,
  context: string,
): InventoryServiceResult<T> {
  if (error instanceof InventoryValidationError) {
    return errorResult(error.status, error.message, error.errors);
  }

  if (isPrismaRecordNotFoundError(error)) {
    return errorResult(404, "No se encontró la línea del documento.");
  }

  console.error(context, error);

  return errorResult(
    500,
    "Ocurrió un error interno al procesar la línea del documento.",
  );
}

async function requireDraftInventoryDocument(inventoryDocumentId: string) {
  const document = await findInventoryDocumentById(inventoryDocumentId);

  if (!document) {
    throw new InventoryValidationError(
      "No se encontró el documento de inventario.",
      {
        status: 404,
      },
    );
  }

  if (document.status !== InventoryDocumentStatus.DRAFT) {
    throw new InventoryValidationError(
      "Solo los documentos en borrador pueden modificar sus líneas.",
      {
        status: 409,
      },
    );
  }

  return document;
}

async function getRequiredDocumentLineDetail(inventoryDocumentLineId: string) {
  const line = await findInventoryDocumentLineDetailById(
    inventoryDocumentLineId,
  );

  if (!line) {
    throw new InventoryValidationError(
      "No se encontró la línea del documento.",
      {
        status: 404,
      },
    );
  }

  return line;
}

export async function getInventoryDocumentLineById(
  inventoryDocumentLineId: unknown,
): Promise<InventoryServiceResult<InventoryDocumentLineResponse>> {
  try {
    const normalizedId = normalizeInventoryDocumentLineId(
      inventoryDocumentLineId,
    );

    const line = await getRequiredDocumentLineDetail(normalizedId);

    return successResult(200, mapInventoryDocumentLine(line));
  } catch (error) {
    return handleDocumentLineServiceError(
      error,
      "GET inventory document line error:",
    );
  }
}

export async function createInventoryDocumentLine(
  inventoryDocumentId: unknown,
  input: unknown,
): Promise<InventoryServiceResult<InventoryDocumentLineResponse>> {
  try {
    const normalizedDocumentId =
      normalizeInventoryDocumentId(inventoryDocumentId);

    await requireDraftInventoryDocument(normalizedDocumentId);

    const normalizedInput = normalizeInventoryDocumentLineCreateInput(input);

    const resolvedData =
      await resolveInventoryDocumentLineData(normalizedInput);

    const createdLine = await createInventoryDocumentLineRecord(
      normalizedDocumentId,
      resolvedData,
    );

    const line = await getRequiredDocumentLineDetail(
      createdLine.inventory_document_line_id,
    );

    return successResult(
      201,
      mapInventoryDocumentLine(line),
      "Línea agregada correctamente.",
    );
  } catch (error) {
    return handleDocumentLineServiceError(
      error,
      "POST inventory document line error:",
    );
  }
}

export async function updateInventoryDocumentLine(
  inventoryDocumentLineId: unknown,
  input: unknown,
): Promise<InventoryServiceResult<InventoryDocumentLineResponse>> {
  try {
    const normalizedLineId = normalizeInventoryDocumentLineId(
      inventoryDocumentLineId,
    );

    const existingLine = await findInventoryDocumentLineById(normalizedLineId);

    if (!existingLine) {
      throw new InventoryValidationError(
        "No se encontró la línea del documento.",
        {
          status: 404,
        },
      );
    }

    await requireDraftInventoryDocument(existingLine.inventory_document_id);

    const updateData = normalizeInventoryDocumentLineUpdateInput(input);

    const mergedInput: InventoryDocumentLineCreateInputData = {
      inventory_product_variant_id:
        updateData.inventory_product_variant_id ??
        existingLine.inventory_product_variant_id,

      inventory_product_code_id:
        updateData.inventory_product_code_id !== undefined
          ? updateData.inventory_product_code_id
          : existingLine.inventory_product_code_id,

      unit_of_measure_id:
        updateData.unit_of_measure_id ?? existingLine.unit_of_measure_id,

      quantity: updateData.quantity ?? existingLine.quantity.toString(),

      conversion_factor:
        updateData.conversion_factor ??
        existingLine.conversion_factor.toString(),

      unit_cost: updateData.unit_cost ?? existingLine.unit_cost.toString(),

      notes:
        updateData.notes !== undefined ? updateData.notes : existingLine.notes,
    };

    const resolvedData = await resolveInventoryDocumentLineData(mergedInput);

    await updateInventoryDocumentLineRecord(
      normalizedLineId,
      existingLine.inventory_document_id,
      resolvedData,
    );

    const updatedLine = await getRequiredDocumentLineDetail(normalizedLineId);

    return successResult(
      200,
      mapInventoryDocumentLine(updatedLine),
      "Línea actualizada correctamente.",
    );
  } catch (error) {
    return handleDocumentLineServiceError(
      error,
      "PATCH inventory document line error:",
    );
  }
}

export async function deleteInventoryDocumentLine(
  inventoryDocumentLineId: unknown,
): Promise<InventoryServiceResult<DeletedInventoryDocumentLineResponse>> {
  try {
    const normalizedLineId = normalizeInventoryDocumentLineId(
      inventoryDocumentLineId,
    );

    const existingLine = await findInventoryDocumentLineById(normalizedLineId);

    if (!existingLine) {
      throw new InventoryValidationError(
        "No se encontró la línea del documento.",
        {
          status: 404,
        },
      );
    }

    await requireDraftInventoryDocument(existingLine.inventory_document_id);

    await deleteInventoryDocumentLineRecord(
      normalizedLineId,
      existingLine.inventory_document_id,
    );

    return successResult(
      200,
      {
        inventory_document_line_id: normalizedLineId,
        inventory_document_id: existingLine.inventory_document_id,
        deleted: true,
      },
      "Línea eliminada correctamente.",
    );
  } catch (error) {
    return handleDocumentLineServiceError(
      error,
      "DELETE inventory document line error:",
    );
  }
}
