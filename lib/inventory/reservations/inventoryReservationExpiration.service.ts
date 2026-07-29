import { findInventoryReservationDetailById } from "./inventoryReservation.repository";

import { mapInventoryReservationDetail } from "./inventoryReservation.mapper";

import { expireDueInventoryReservationRecords } from "./inventoryReservationExpirationBatch.repository";

import { expireInventoryReservationRecord } from "./inventoryReservationExpiration.repository";

import {
  InventoryReservationExpirationError,
  type InventoryReservationExpirationBatchResponse,
  type InventoryReservationExpirationResponse,
} from "./inventoryReservationExpiration.types";

import {
  normalizeInventoryReservationExpirationBatchInput,
  normalizeInventoryReservationExpirationId,
  normalizeInventoryReservationExpirationInput,
} from "./inventoryReservationExpiration.validators";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

function resolveExpirationErrorStatus(
  error: InventoryReservationExpirationError,
) {
  switch (error.code) {
    case "INVALID_RESERVATION_ID":
    case "INVALID_REQUEST_BODY":
    case "INVALID_EXPIRATION_REASON":
    case "INVALID_EXPIRED_BY":
    case "INVALID_BATCH_LIMIT":
      return 400;

    case "RESERVATION_NOT_FOUND":
      return 404;

    default:
      return 409;
  }
}

function buildExpirationErrorResponse<T>(
  error: InventoryReservationExpirationError,
): InventoryServiceResult<T> {
  return {
    status: resolveExpirationErrorStatus(error),

    body: {
      success: false,

      message: error.message,

      errors: error.errors,
    },
  };
}

function buildUnexpectedExpirationResponse<T>(
  message: string,
): InventoryServiceResult<T> {
  return {
    status: 500,

    body: {
      success: false,

      message,
    },
  };
}

export async function expireInventoryReservation(
  inventoryReservationIdValue: unknown,
  inputValue: unknown,
): Promise<InventoryServiceResult<InventoryReservationExpirationResponse>> {
  try {
    const inventoryReservationId = normalizeInventoryReservationExpirationId(
      inventoryReservationIdValue,
    );

    const input = normalizeInventoryReservationExpirationInput(inputValue);

    const expirationResult = await expireInventoryReservationRecord(
      inventoryReservationId,
      input,
    );

    const reservation = await findInventoryReservationDetailById(
      expirationResult.inventoryReservationId,
    );

    if (!reservation) {
      return {
        status: 404,

        body: {
          success: false,

          message: "La reserva de inventario no existe.",

          errors: {
            inventory_reservation_id: "No se encontró la reserva solicitada.",
          },
        },
      };
    }

    const message =
      expirationResult.outcome === "ALREADY_EXPIRED"
        ? "La reserva ya estaba vencida. No se liberaron existencias adicionales."
        : "Reserva de inventario vencida correctamente.";

    return {
      status: 200,

      body: {
        success: true,

        data: {
          outcome: expirationResult.outcome,

          quantity_released: expirationResult.quantityReleased,

          reservation: mapInventoryReservationDetail(reservation),
        },

        message,
      },
    };
  } catch (error) {
    if (error instanceof InventoryReservationExpirationError) {
      return buildExpirationErrorResponse(error);
    }

    console.error("Inventory reservation expiration error:", error);

    return buildUnexpectedExpirationResponse(
      "Ocurrió un error al vencer la reserva de inventario.",
    );
  }
}

export async function expireDueInventoryReservations(
  inputValue: unknown,
): Promise<
  InventoryServiceResult<InventoryReservationExpirationBatchResponse>
> {
  try {
    const input = normalizeInventoryReservationExpirationBatchInput(inputValue);

    const result = await expireDueInventoryReservationRecords(input);

    return {
      status: 200,

      body: {
        success: true,

        data: result,

        message:
          result.matched === 0
            ? "No existen reservas vencidas pendientes."
            : "Proceso de vencimiento de reservas completado.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryReservationExpirationError) {
      return buildExpirationErrorResponse(error);
    }

    console.error("Inventory reservation batch expiration error:", error);

    return buildUnexpectedExpirationResponse(
      "Ocurrió un error al procesar las reservas vencidas.",
    );
  }
}
