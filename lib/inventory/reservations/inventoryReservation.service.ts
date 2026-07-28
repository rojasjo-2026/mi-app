import {
  InventoryValidationError,
  isPrismaUniqueConstraintError,
} from "../shared/inventoryErrors";

import type {
  InventoryFieldErrors,
  InventoryServiceResult,
} from "../shared/inventoryServiceResult.types";

import { mapInventoryReservationDetail } from "./inventoryReservation.mapper";

import {
  createInventoryReservationRecord,
  findInventoryReservationByIdempotencyKey,
  findInventoryReservationLocationsByIds,
  findInventoryReservationVariantsByIds,
} from "./inventoryReservation.repository";

import type {
  InventoryReservationCreateData,
  InventoryReservationDetailResponse,
} from "./inventoryReservation.types";

import { normalizeInventoryReservationCreateInput } from "./inventoryReservation.validators";

import { generateInventoryReservationNumber } from "./inventoryReservationNumber";

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

function handleReservationServiceError<T>(
  error: unknown,
  context: string,
): InventoryServiceResult<T> {
  if (error instanceof InventoryValidationError) {
    return errorResult(error.status, error.message, error.errors);
  }

  if (isPrismaUniqueConstraintError(error)) {
    return errorResult(
      409,
      "Ya existe una reserva con la misma información única.",
    );
  }

  console.error(context, error);

  return errorResult(
    500,
    "Ocurrió un error interno al procesar la reserva de inventario.",
  );
}

async function validateReservationReferences(
  data: InventoryReservationCreateData,
) {
  const variantIds = [
    ...new Set(data.lines.map((line) => line.inventory_product_variant_id)),
  ];

  const locationIds = [
    ...new Set(data.lines.map((line) => line.inventory_location_id)),
  ];

  const [variants, locations] = await Promise.all([
    findInventoryReservationVariantsByIds(variantIds),
    findInventoryReservationLocationsByIds(locationIds),
  ]);

  const variantById = new Map(
    variants.map((variant) => [variant.inventory_product_variant_id, variant]),
  );

  const locationById = new Map(
    locations.map((location) => [location.inventory_location_id, location]),
  );

  const errors: InventoryFieldErrors = {};

  let missingReference = false;
  let invalidState = false;

  for (const [index, line] of data.lines.entries()) {
    const variant = variantById.get(line.inventory_product_variant_id);

    const location = locationById.get(line.inventory_location_id);

    const variantField = `lines.${index}.inventory_product_variant_id`;

    const locationField = `lines.${index}.inventory_location_id`;

    if (!variant) {
      errors[variantField] = "La variante indicada no existe.";

      missingReference = true;
    } else if (!variant.is_active) {
      errors[variantField] = "La variante indicada está inactiva.";

      invalidState = true;
    } else if (!variant.product.is_active) {
      errors[variantField] = "El producto asociado está inactivo.";

      invalidState = true;
    } else if (!variant.product.manages_stock) {
      errors[variantField] = "El producto asociado no administra existencias.";

      invalidState = true;
    }

    if (!location) {
      errors[locationField] = "La ubicación indicada no existe.";

      missingReference = true;
    } else if (!location.is_active) {
      errors[locationField] = "La ubicación indicada está inactiva.";

      invalidState = true;
    } else if (!location.allows_stock) {
      errors[locationField] = "La ubicación indicada no permite existencias.";

      invalidState = true;
    }
  }

  if (Object.keys(errors).length === 0) {
    return;
  }

  throw new InventoryValidationError(
    missingReference
      ? "No se encontraron algunas referencias de la reserva."
      : "La reserva contiene elementos que no están disponibles para operar.",
    {
      status: missingReference ? 404 : invalidState ? 409 : 400,

      errors,
    },
  );
}

export async function createInventoryReservation(
  input: unknown,
): Promise<InventoryServiceResult<InventoryReservationDetailResponse>> {
  try {
    const data = normalizeInventoryReservationCreateInput(input);

    if (data.idempotency_key) {
      const existingReservation =
        await findInventoryReservationByIdempotencyKey(data.idempotency_key);

      if (existingReservation) {
        return successResult(
          200,
          mapInventoryReservationDetail(existingReservation),
          "La reserva ya había sido creada con la misma llave de idempotencia.",
        );
      }
    }

    await validateReservationReferences(data);

    try {
      const reservation = await createInventoryReservationRecord(
        generateInventoryReservationNumber(),
        data,
      );

      return successResult(
        201,
        mapInventoryReservationDetail(reservation),
        "Reserva de inventario creada correctamente.",
      );
    } catch (error) {
      if (isPrismaUniqueConstraintError(error) && data.idempotency_key) {
        const existingReservation =
          await findInventoryReservationByIdempotencyKey(data.idempotency_key);

        if (existingReservation) {
          return successResult(
            200,
            mapInventoryReservationDetail(existingReservation),
            "La reserva ya había sido creada con la misma llave de idempotencia.",
          );
        }
      }

      throw error;
    }
  } catch (error) {
    return handleReservationServiceError(
      error,
      "POST inventory reservation error:",
    );
  }
}
