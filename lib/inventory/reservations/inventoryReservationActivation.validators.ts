import { normalizeCatalogUuid } from "../shared/inventoryCatalogValidation";

import { InventoryValidationError } from "../shared/inventoryErrors";

import { InventoryReservationActivationError } from "./inventoryReservationActivation.types";

export function normalizeInventoryReservationActivationId(value: unknown) {
  try {
    return normalizeCatalogUuid(value, "El identificador de la reserva");
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      throw new InventoryReservationActivationError(
        "INVALID_RESERVATION_ID",
        error.message,
        error.errors,
      );
    }

    throw error;
  }
}
