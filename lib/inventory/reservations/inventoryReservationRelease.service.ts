import { mapInventoryReservationDetail } from "./inventoryReservation.mapper";

import { findInventoryReservationDetailById } from "./inventoryReservation.repository";

import { releaseInventoryReservationRecord } from "./inventoryReservationRelease.repository";

import { InventoryReservationReleaseError } from "./inventoryReservationRelease.types";

import {
  normalizeInventoryReservationReleaseId,
  normalizeInventoryReservationReleaseInput,
} from "./inventoryReservationRelease.validators";

import type { InventoryReservationDetailResponse } from "./inventoryReservation.types";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

function resolveReleaseErrorStatus(error: InventoryReservationReleaseError) {
  switch (error.code) {
    case "INVALID_RESERVATION_ID":
    case "INVALID_REQUEST_BODY":
    case "RELEASE_REASON_REQUIRED":
    case "RELEASE_REASON_TOO_LONG":
    case "INVALID_RELEASED_BY":
    case "RELEASED_BY_TOO_LONG":
      return 400;

    case "RESERVATION_NOT_FOUND":
      return 404;

    default:
      return 409;
  }
}

function buildReleaseErrorResponse(
  error: InventoryReservationReleaseError,
): InventoryServiceResult<InventoryReservationDetailResponse> {
  return {
    status: resolveReleaseErrorStatus(error),
    body: {
      success: false,
      message: error.message,
      errors: error.errors,
    },
  };
}

function buildUnexpectedReleaseResponse(): InventoryServiceResult<InventoryReservationDetailResponse> {
  return {
    status: 500,
    body: {
      success: false,
      message: "Ocurrió un error al liberar la reserva de inventario.",
    },
  };
}

export async function releaseInventoryReservation(
  inventoryReservationIdValue: unknown,
  inputValue: unknown,
): Promise<InventoryServiceResult<InventoryReservationDetailResponse>> {
  try {
    const inventoryReservationId = normalizeInventoryReservationReleaseId(
      inventoryReservationIdValue,
    );

    const input = normalizeInventoryReservationReleaseInput(inputValue);

    const releaseResult = await releaseInventoryReservationRecord(
      inventoryReservationId,
      input,
    );

    const reservation = await findInventoryReservationDetailById(
      releaseResult.inventoryReservationId,
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
      releaseResult.outcome === "ALREADY_RELEASED"
        ? "La reserva ya estaba liberada. No se modificaron existencias adicionales."
        : "Reserva de inventario liberada correctamente.";

    return {
      status: 200,
      body: {
        success: true,
        data: mapInventoryReservationDetail(reservation),
        message,
      },
    };
  } catch (error) {
    if (error instanceof InventoryReservationReleaseError) {
      return buildReleaseErrorResponse(error);
    }

    console.error("Inventory reservation release error:", error);

    return buildUnexpectedReleaseResponse();
  }
}
