import { InventoryValidationError } from "../shared/inventoryErrors";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import {
  mapInventoryStockBalance,
  mapInventoryStockBalances,
} from "./inventoryStockBalance.mapper";

import {
  findInventoryStockBalanceDetailById,
  findInventoryStockBalances,
} from "./inventoryStockBalance.repository";

import type { InventoryStockBalanceResponse } from "./inventoryStockBalance.types";

import {
  normalizeInventoryStockBalanceFilters,
  normalizeInventoryStockBalanceId,
} from "./inventoryStockBalance.validators";

function buildValidationResponse<T>(
  error: InventoryValidationError,
): InventoryServiceResult<T> {
  return {
    status: error.status,
    body: {
      success: false,
      message: error.message,
      errors: error.errors,
    },
  };
}

function buildNotFoundResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 404,
    body: {
      success: false,
      message: "No se encontró el saldo de inventario.",
    },
  };
}

function buildUnexpectedResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 500,
    body: {
      success: false,
      message: "Ocurrió un error al consultar las existencias.",
    },
  };
}

export async function getInventoryStockBalancesFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<InventoryStockBalanceResponse[]>> {
  try {
    const filters = normalizeInventoryStockBalanceFilters(searchParams);

    const balances = await findInventoryStockBalances(filters);

    return {
      status: 200,
      body: {
        success: true,
        data: mapInventoryStockBalances(balances),
        message:
          balances.length === 0
            ? "No hay existencias que coincidan con los filtros."
            : undefined,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryStockBalancesFromSearchParams error:", error);

    return buildUnexpectedResponse();
  }
}

export async function getInventoryStockBalanceById(
  id: unknown,
): Promise<InventoryServiceResult<InventoryStockBalanceResponse>> {
  try {
    const balanceId = normalizeInventoryStockBalanceId(id);

    const balance = await findInventoryStockBalanceDetailById(balanceId);

    if (!balance) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: mapInventoryStockBalance(balance),
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryStockBalanceById error:", error);

    return buildUnexpectedResponse();
  }
}
