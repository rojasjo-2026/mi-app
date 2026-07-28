import { InventoryValidationError } from "../shared/inventoryErrors";

import type {
  InventoryFieldErrors,
  InventoryServiceResult,
} from "../shared/inventoryServiceResult.types";

import { mapInventoryStockBalances } from "./inventoryStockBalance.mapper";

import {
  countInventoryStockBalances,
  findInventoryStockBalances,
} from "./inventoryStockBalance.repository";

import type { InventoryStockBalanceListResponse } from "./inventoryStockBalance.types";

import { normalizeInventoryStockBalanceQuery } from "./inventoryStockBalance.validators";

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

function handleStockBalanceServiceError<T>(
  error: unknown,
): InventoryServiceResult<T> {
  if (error instanceof InventoryValidationError) {
    return errorResult(error.status, error.message, error.errors);
  }

  console.error("GET inventory stock balances error:", error);

  return errorResult(
    500,
    "No fue posible consultar las existencias de inventario.",
  );
}

export async function getInventoryStockBalancesFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<InventoryStockBalanceListResponse>> {
  try {
    const query = normalizeInventoryStockBalanceQuery(searchParams);

    const [balances, totalItems] = await Promise.all([
      findInventoryStockBalances(query),

      countInventoryStockBalances(query.filters),
    ]);

    const totalPages =
      totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);

    return successResult(200, {
      items: mapInventoryStockBalances(balances),

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
    return handleStockBalanceServiceError(error);
  }
}
