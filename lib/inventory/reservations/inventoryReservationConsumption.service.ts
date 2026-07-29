import { findInventoryReservationDetailById } from "./inventoryReservation.repository";

import { mapInventoryReservationDetail } from "./inventoryReservation.mapper";

import { consumeInventoryReservationRecord } from "./inventoryReservationConsumption.repository";

import {
  InventoryReservationConsumptionError,
  type InventoryReservationConsumptionResponse,
} from "./inventoryReservationConsumption.types";

import {
  normalizeInventoryReservationConsumptionId,
  normalizeInventoryReservationConsumptionInput,
} from "./inventoryReservationConsumption.validators";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

function resolveConsumptionErrorStatus(
  error: InventoryReservationConsumptionError,
) {
  switch (error.code) {
    case "INVALID_RESERVATION_ID":
    case "INVALID_REQUEST_BODY":
    case "INVALID_IDEMPOTENCY_KEY":
    case "INVALID_CONSUMPTION_REASON":
    case "INVALID_CONSUMED_BY":
    case "INVALID_LINES":
    case "INVALID_LINE_ID":
    case "INVALID_QUANTITY":
    case "INVALID_UNIT_QUANTITY":
    case "MULTIPLE_SOURCE_LOCATIONS":
      return 400;

    case "RESERVATION_NOT_FOUND":
    case "RESERVATION_LINE_NOT_FOUND":
      return 404;

    default:
      return 409;
  }
}

function buildConsumptionErrorResponse(
  error: InventoryReservationConsumptionError,
): InventoryServiceResult<InventoryReservationConsumptionResponse> {
  return {
    status: resolveConsumptionErrorStatus(error),

    body: {
      success: false,
      message: error.message,
      errors: error.errors,
    },
  };
}

function buildUnexpectedConsumptionResponse(): InventoryServiceResult<InventoryReservationConsumptionResponse> {
  return {
    status: 500,

    body: {
      success: false,

      message: "Ocurrió un error al consumir la reserva de inventario.",
    },
  };
}

export async function consumeInventoryReservation(
  inventoryReservationIdValue: unknown,
  inputValue: unknown,
): Promise<InventoryServiceResult<InventoryReservationConsumptionResponse>> {
  try {
    const inventoryReservationId = normalizeInventoryReservationConsumptionId(
      inventoryReservationIdValue,
    );

    const input = normalizeInventoryReservationConsumptionInput(inputValue);

    const consumptionResult = await consumeInventoryReservationRecord(
      inventoryReservationId,
      input,
    );

    const reservation = await findInventoryReservationDetailById(
      consumptionResult.inventoryReservationId,
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

    let message: string;

    if (consumptionResult.outcome === "ALREADY_CONSUMED") {
      message =
        "La operación ya había sido procesada. No se descontaron existencias adicionales.";
    } else if (consumptionResult.reservationStatus === "CONSUMED") {
      message = "Reserva de inventario consumida completamente.";
    } else {
      message = "Consumo parcial de la reserva registrado correctamente.";
    }

    return {
      status: 200,

      body: {
        success: true,

        data: {
          inventory_document_id: consumptionResult.inventoryDocumentId,

          outcome: consumptionResult.outcome,

          reservation: mapInventoryReservationDetail(reservation),
        },

        message,
      },
    };
  } catch (error) {
    if (error instanceof InventoryReservationConsumptionError) {
      return buildConsumptionErrorResponse(error);
    }

    console.error("Inventory reservation consumption error:", error);

    return buildUnexpectedConsumptionResponse();
  }
}
