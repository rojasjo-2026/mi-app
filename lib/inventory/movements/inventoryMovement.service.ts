import { InventoryValidationError } from "../shared/inventoryErrors";

import type {
  InventoryFieldErrors,
  InventoryServiceResult,
} from "../shared/inventoryServiceResult.types";

import {
  mapInventoryMovement,
  mapInventoryMovements,
} from "./inventoryMovement.mapper";

import {
  countInventoryMovements,
  findInventoryMovementById,
  findInventoryMovements,
} from "./inventoryMovement.repository";

import type {
  InventoryMovementListResponse,
  InventoryMovementResponse,
} from "./inventoryMovement.types";

import {
  normalizeInventoryMovementId,
  normalizeInventoryMovementQuery,
} from "./inventoryMovement.validators";

function successResult<T>(status: number, data: T): InventoryServiceResult<T> {
  return {
    status,

    body: {
      success: true,
      data,
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

      ...(errors
        ? {
            errors,
          }
        : {}),
    },
  };
}

function handleMovementServiceError<T>(
  error: unknown,
  context: string,
): InventoryServiceResult<T> {
  if (error instanceof InventoryValidationError) {
    return errorResult(error.status, error.message, error.errors);
  }

  console.error(context, error);

  return errorResult(
    500,
    "No fue posible consultar los movimientos de inventario.",
  );
}

export async function getInventoryMovementsFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<InventoryMovementListResponse>> {
  try {
    const query = normalizeInventoryMovementQuery(searchParams);

    const [movements, totalItems] = await Promise.all([
      findInventoryMovements(query),

      countInventoryMovements(query.filters),
    ]);

    const totalPages =
      totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);

    return successResult(200, {
      items: mapInventoryMovements(movements),

      pagination: {
        page: query.page,

        page_size: query.pageSize,

        total_items: totalItems,

        total_pages: totalPages,

        has_previous_page: query.page > 1,

        has_next_page: query.page < totalPages,
      },
    });
  } catch (error) {
    return handleMovementServiceError(error, "GET inventory movements error:");
  }
}

export async function getInventoryMovementById(
  inventoryMovementId: unknown,
): Promise<InventoryServiceResult<InventoryMovementResponse>> {
  try {
    const normalizedId = normalizeInventoryMovementId(inventoryMovementId);

    const movement = await findInventoryMovementById(normalizedId);

    if (!movement) {
      return errorResult(404, "No se encontró el movimiento de inventario.", {
        inventory_movement_id: "El movimiento solicitado no existe.",
      });
    }

    return successResult(200, mapInventoryMovement(movement));
  } catch (error) {
    return handleMovementServiceError(
      error,
      "GET inventory movement detail error:",
    );
  }
}
