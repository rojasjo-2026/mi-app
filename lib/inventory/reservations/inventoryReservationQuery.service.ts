import { InventoryValidationError } from "../shared/inventoryErrors";

import type {
  InventoryFieldErrors,
  InventoryServiceResult,
} from "../shared/inventoryServiceResult.types";

import { findInventoryReservationDetailById } from "./inventoryReservation.repository";

import {
  mapInventoryReservationList,
  mapInventoryReservationManagementDetail,
} from "./inventoryReservationQuery.mapper";

import {
  countInventoryReservations,
  findInventoryReservationConsumptionDocuments,
  findInventoryReservations,
} from "./inventoryReservationQuery.repository";

import type {
  InventoryReservationListResponse,
  InventoryReservationManagementDetailResponse,
} from "./inventoryReservationQuery.types";

import {
  normalizeInventoryReservationQuery,
  normalizeInventoryReservationQueryId,
} from "./inventoryReservationQuery.validators";

const DEFAULT_DETAIL_EXPIRING_WITHIN_DAYS = 7;

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

function handleQueryError<T>(
  error: unknown,
  logMessage: string,
): InventoryServiceResult<T> {
  if (error instanceof InventoryValidationError) {
    return errorResult(error.status, error.message, error.errors);
  }

  console.error(logMessage, error);

  return errorResult(
    500,
    "No fue posible consultar las reservas de inventario.",
  );
}

export async function getInventoryReservationsFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<InventoryReservationListResponse>> {
  try {
    const query = normalizeInventoryReservationQuery(searchParams);

    const [reservations, totalItems] = await Promise.all([
      findInventoryReservations(query),

      countInventoryReservations(query),
    ]);

    const totalPages =
      totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize);

    return successResult(200, {
      items: mapInventoryReservationList(
        reservations,
        query.asOf,
        query.expiringWithinDays,
      ),

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
    return handleQueryError(error, "GET inventory reservations error:");
  }
}

export async function getInventoryReservationManagementDetail(
  inventoryReservationIdValue: unknown,
): Promise<
  InventoryServiceResult<InventoryReservationManagementDetailResponse>
> {
  try {
    const inventoryReservationId = normalizeInventoryReservationQueryId(
      inventoryReservationIdValue,
    );

    const reservation = await findInventoryReservationDetailById(
      inventoryReservationId,
    );

    if (!reservation) {
      return errorResult(404, "La reserva de inventario no existe.", {
        inventory_reservation_id: "No se encontro la reserva solicitada.",
      });
    }

    const documents = await findInventoryReservationConsumptionDocuments(
      inventoryReservationId,
    );

    return successResult(
      200,
      mapInventoryReservationManagementDetail(
        reservation,
        documents,
        new Date(),
        DEFAULT_DETAIL_EXPIRING_WITHIN_DAYS,
      ),
    );
  } catch (error) {
    return handleQueryError(error, "GET inventory reservation detail error:");
  }
}
