import { mapInventoryReservationDetail } from "./inventoryReservation.mapper";

import { findInventoryReservationDetailById } from "./inventoryReservation.repository";

import { cancelInventoryReservationRecord } from "./inventoryReservationCancellation.repository";

import {
  InventoryReservationCancellationError,
  type InventoryReservationCancellationResponse,
} from "./inventoryReservationCancellation.types";

import {
  normalizeInventoryReservationCancellationId,
  normalizeInventoryReservationCancellationInput,
} from "./inventoryReservationCancellation.validators";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

function resolveCancellationErrorStatus(
  error: InventoryReservationCancellationError,
) {
  switch (error.code) {
    case "INVALID_RESERVATION_ID":
    case "INVALID_REQUEST_BODY":
    case "INVALID_CANCELLATION_REASON":
    case "INVALID_CANCELLED_BY":
      return 400;

    case "RESERVATION_NOT_FOUND":
      return 404;

    default:
      return 409;
  }
}

function buildCancellationErrorResponse(
  error: InventoryReservationCancellationError,
): InventoryServiceResult<InventoryReservationCancellationResponse> {
  return {
    status: resolveCancellationErrorStatus(error),

    body: {
      success: false,

      message: error.message,

      errors: error.errors,
    },
  };
}

export async function cancelInventoryReservation(
  inventoryReservationIdValue: unknown,
  inputValue: unknown,
): Promise<InventoryServiceResult<InventoryReservationCancellationResponse>> {
  try {
    const inventoryReservationId = normalizeInventoryReservationCancellationId(
      inventoryReservationIdValue,
    );

    const input = normalizeInventoryReservationCancellationInput(inputValue);

    const cancellationResult = await cancelInventoryReservationRecord(
      inventoryReservationId,
      input,
    );

    const reservation = await findInventoryReservationDetailById(
      cancellationResult.inventoryReservationId,
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
      cancellationResult.outcome === "ALREADY_CANCELLED"
        ? "La reserva ya estaba cancelada. No se realizaron cambios adicionales."
        : "Reserva de inventario cancelada correctamente.";

    return {
      status: 200,

      body: {
        success: true,

        data: {
          outcome: cancellationResult.outcome,

          reservation: mapInventoryReservationDetail(reservation),
        },

        message,
      },
    };
  } catch (error) {
    if (error instanceof InventoryReservationCancellationError) {
      return buildCancellationErrorResponse(error);
    }

    console.error("Inventory reservation cancellation error:", error);

    return {
      status: 500,

      body: {
        success: false,

        message: "Ocurrió un error al cancelar la reserva de inventario.",
      },
    };
  }
}
