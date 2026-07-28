import { findInventoryReservationDetailById } from "./inventoryReservation.repository";

import { mapInventoryReservationDetail } from "./inventoryReservation.mapper";

import { InventoryReservationActivationError } from "./inventoryReservationActivation.types";

import { activateInventoryReservationRecord } from "./inventoryReservationActivation.repository";

import { normalizeInventoryReservationActivationId } from "./inventoryReservationActivation.validators";

import type { InventoryReservationDetailResponse } from "./inventoryReservation.types";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

function resolveActivationErrorStatus(
  error: InventoryReservationActivationError,
) {
  switch (error.code) {
    case "INVALID_RESERVATION_ID":
      return 400;

    case "RESERVATION_NOT_FOUND":
      return 404;

    default:
      return 409;
  }
}

function buildActivationErrorResponse(
  error: InventoryReservationActivationError,
): InventoryServiceResult<InventoryReservationDetailResponse> {
  return {
    status: resolveActivationErrorStatus(error),
    body: {
      success: false,
      message: error.message,
      errors: error.errors,
    },
  };
}

function buildUnexpectedActivationResponse(): InventoryServiceResult<InventoryReservationDetailResponse> {
  return {
    status: 500,
    body: {
      success: false,
      message: "Ocurrió un error al activar la reserva de inventario.",
    },
  };
}

export async function activateInventoryReservation(
  inventoryReservationIdValue: unknown,
): Promise<InventoryServiceResult<InventoryReservationDetailResponse>> {
  try {
    const inventoryReservationId = normalizeInventoryReservationActivationId(
      inventoryReservationIdValue,
    );

    const activationResult = await activateInventoryReservationRecord(
      inventoryReservationId,
    );

    const reservation = await findInventoryReservationDetailById(
      activationResult.inventoryReservationId,
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
      activationResult.outcome === "ALREADY_ACTIVE"
        ? "La reserva ya estaba activa. No se reservaron existencias adicionales."
        : "Reserva de inventario activada correctamente.";

    return {
      status: 200,
      body: {
        success: true,
        data: mapInventoryReservationDetail(reservation),
        message,
      },
    };
  } catch (error) {
    if (error instanceof InventoryReservationActivationError) {
      return buildActivationErrorResponse(error);
    }

    console.error("Inventory reservation activation error:", error);

    return buildUnexpectedActivationResponse();
  }
}
