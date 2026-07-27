import type { InventoryLocation, Prisma } from "@prisma/client";

import {
  InventoryValidationError,
  isPrismaForeignKeyConstraintError,
  isPrismaRecordNotFoundError,
  isPrismaUniqueConstraintError,
} from "../shared/inventoryErrors";

import type { InventoryServiceResult } from "../shared/inventoryServiceResult.types";

import { wouldCreateInventoryLocationCycle } from "./inventoryLocationHierarchy";

import {
  mapInventoryLocationDetail,
  mapInventoryLocations,
} from "./inventoryLocation.mapper";

import {
  countActiveInventoryLocationChildren,
  createInventoryLocationRecord,
  deactivateInventoryLocationRecord,
  findInventoryLocationByCode,
  findInventoryLocationById,
  findInventoryLocationDetailById,
  findInventoryLocationParentLinkById,
  findInventoryLocations,
  getInventoryLocationStockTotals,
  updateInventoryLocationRecord,
} from "./inventoryLocation.repository";

import type {
  InventoryLocationDetailResponse,
  InventoryLocationResponse,
  InventoryLocationUpdateData,
} from "./inventoryLocation.types";

import {
  normalizeInventoryLocationCreateInput,
  normalizeInventoryLocationFilters,
  normalizeInventoryLocationId,
  normalizeInventoryLocationUpdateInput,
  validateInventoryLocationCoordinates,
} from "./inventoryLocation.validators";

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
      message: "No se encontró la ubicación de inventario.",
    },
  };
}

function buildDuplicateCodeResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "Ya existe una ubicación con ese código.",
      errors: {
        location_code: "El código ya está registrado.",
      },
    },
  };
}

function buildParentNotFoundResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 404,
    body: {
      success: false,
      message: "No se encontró la ubicación padre seleccionada.",
      errors: {
        parent_location_id: "La ubicación padre no existe.",
      },
    },
  };
}

function buildParentInactiveResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message: "La ubicación padre seleccionada está desactivada.",
      errors: {
        parent_location_id: "Debe seleccionar una ubicación padre activa.",
      },
    },
  };
}

function buildHierarchyCycleResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message:
        "La ubicación padre seleccionada produciría un ciclo en la jerarquía.",
      errors: {
        parent_location_id:
          "Una ubicación no puede depender de sí misma ni de una de sus ubicaciones hijas.",
      },
    },
  };
}

function buildActiveChildrenResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message:
        "No se puede desactivar la ubicación porque tiene ubicaciones hijas activas.",
      errors: {
        is_active: "Primero debe desactivar o trasladar las ubicaciones hijas.",
      },
    },
  };
}

function buildStockExistsResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message:
        "La ubicación todavía contiene existencias o cantidades reservadas.",
      errors: {
        inventory:
          "Traslade o ajuste el inventario antes de realizar esta acción.",
      },
    },
  };
}

function buildInactiveDefaultResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 409,
    body: {
      success: false,
      message:
        "Una ubicación desactivada no puede ser la ubicación predeterminada.",
      errors: {
        is_default:
          "Active la ubicación antes de marcarla como predeterminada.",
      },
    },
  };
}

function buildUnexpectedResponse<T>(): InventoryServiceResult<T> {
  return {
    status: 500,
    body: {
      success: false,
      message: "Ocurrió un error al procesar la ubicación de inventario.",
    },
  };
}

function hasNonZeroQuantity(value: Prisma.Decimal | null | undefined) {
  return value ? !value.isZero() : false;
}

async function locationHasStock(inventoryLocationId: string) {
  const totals = await getInventoryLocationStockTotals(inventoryLocationId);

  return (
    hasNonZeroQuantity(totals._sum.quantity_on_hand) ||
    hasNonZeroQuantity(totals._sum.quantity_reserved)
  );
}

async function validateParentAssignment(params: {
  locationId?: string;
  parentLocationId: string | null;
}): Promise<InventoryServiceResult<never> | null> {
  if (!params.parentLocationId) {
    return null;
  }

  if (params.locationId === params.parentLocationId) {
    return buildHierarchyCycleResponse();
  }

  const parentLocation = await findInventoryLocationParentLinkById(
    params.parentLocationId,
  );

  if (!parentLocation) {
    return buildParentNotFoundResponse();
  }

  if (!parentLocation.is_active) {
    return buildParentInactiveResponse();
  }

  if (
    params.locationId &&
    (await wouldCreateInventoryLocationCycle(
      params.locationId,
      params.parentLocationId,
    ))
  ) {
    return buildHierarchyCycleResponse();
  }

  return null;
}

function validateUpdatedCoordinates(
  currentLocation: Pick<InventoryLocation, "latitude" | "longitude">,
  data: InventoryLocationUpdateData,
) {
  if (data.latitude === undefined && data.longitude === undefined) {
    return;
  }

  const latitude =
    data.latitude !== undefined
      ? data.latitude
      : (currentLocation.latitude?.toString() ?? null);

  const longitude =
    data.longitude !== undefined
      ? data.longitude
      : (currentLocation.longitude?.toString() ?? null);

  validateInventoryLocationCoordinates({
    latitude,
    longitude,
  });
}

async function getLocationDetail(
  inventoryLocationId: string,
): Promise<InventoryLocationDetailResponse | null> {
  const location = await findInventoryLocationDetailById(inventoryLocationId);

  return location ? mapInventoryLocationDetail(location) : null;
}

export async function getInventoryLocationsFromSearchParams(
  searchParams: URLSearchParams,
): Promise<InventoryServiceResult<InventoryLocationResponse[]>> {
  try {
    const filters = normalizeInventoryLocationFilters(searchParams);
    const locations = await findInventoryLocations(filters);

    return {
      status: 200,
      body: {
        success: true,
        data: mapInventoryLocations(locations),
        message:
          locations.length === 0
            ? "No hay ubicaciones de inventario configuradas."
            : undefined,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryLocationsFromSearchParams error:", error);

    return buildUnexpectedResponse();
  }
}

export async function getInventoryLocationById(
  id: unknown,
): Promise<InventoryServiceResult<InventoryLocationDetailResponse>> {
  try {
    const locationId = normalizeInventoryLocationId(id);
    const location = await getLocationDetail(locationId);

    if (!location) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: location,
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    console.error("getInventoryLocationById error:", error);
    return buildUnexpectedResponse();
  }
}

export async function createInventoryLocation(
  input: unknown,
): Promise<InventoryServiceResult<InventoryLocationDetailResponse>> {
  try {
    const data = normalizeInventoryLocationCreateInput(input);

    const existingLocation = await findInventoryLocationByCode(
      data.location_code,
    );

    if (existingLocation) {
      return buildDuplicateCodeResponse();
    }

    const parentError = await validateParentAssignment({
      parentLocationId: data.parent_location_id,
    });

    if (parentError) {
      return parentError;
    }

    const createdLocation = await createInventoryLocationRecord(data);

    const location = await getLocationDetail(
      createdLocation.inventory_location_id,
    );

    if (!location) {
      return buildUnexpectedResponse();
    }

    return {
      status: 201,
      body: {
        success: true,
        data: location,
        message: "Ubicación de inventario creada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaUniqueConstraintError(error)) {
      return buildDuplicateCodeResponse();
    }

    if (isPrismaForeignKeyConstraintError(error)) {
      return buildParentNotFoundResponse();
    }

    console.error("createInventoryLocation error:", error);
    return buildUnexpectedResponse();
  }
}

export async function updateInventoryLocation(
  id: unknown,
  input: unknown,
): Promise<InventoryServiceResult<InventoryLocationDetailResponse>> {
  try {
    const locationId = normalizeInventoryLocationId(id);
    const data = normalizeInventoryLocationUpdateInput(input);

    const currentLocation = await findInventoryLocationById(locationId);

    if (!currentLocation) {
      return buildNotFoundResponse();
    }

    if (
      data.location_code &&
      data.location_code !== currentLocation.location_code
    ) {
      const existingLocation = await findInventoryLocationByCode(
        data.location_code,
      );

      if (
        existingLocation &&
        existingLocation.inventory_location_id !== locationId
      ) {
        return buildDuplicateCodeResponse();
      }
    }

    if (data.parent_location_id !== undefined || data.is_active === true) {
      const nextParentLocationId =
        data.parent_location_id !== undefined
          ? data.parent_location_id
          : currentLocation.parent_location_id;

      const parentError = await validateParentAssignment({
        locationId,
        parentLocationId: nextParentLocationId,
      });

      if (parentError) {
        return parentError;
      }
    }

    validateUpdatedCoordinates(currentLocation, data);

    const nextIsActive = data.is_active ?? currentLocation.is_active;

    if (data.is_default === true && !nextIsActive) {
      return buildInactiveDefaultResponse();
    }

    const deactivatesLocation =
      data.is_active === false && currentLocation.is_active;

    const removesStockCapability =
      data.allows_stock === false && currentLocation.allows_stock;

    if (deactivatesLocation) {
      const activeChildrenCount =
        await countActiveInventoryLocationChildren(locationId);

      if (activeChildrenCount > 0) {
        return buildActiveChildrenResponse();
      }
    }

    if (
      (deactivatesLocation || removesStockCapability) &&
      (await locationHasStock(locationId))
    ) {
      return buildStockExistsResponse();
    }

    if (data.is_active === false) {
      data.is_default = false;
    }

    await updateInventoryLocationRecord(locationId, data);

    const location = await getLocationDetail(locationId);

    if (!location) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: location,
        message: "Ubicación de inventario actualizada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaUniqueConstraintError(error)) {
      return buildDuplicateCodeResponse();
    }

    if (isPrismaRecordNotFoundError(error)) {
      return buildNotFoundResponse();
    }

    if (isPrismaForeignKeyConstraintError(error)) {
      return buildParentNotFoundResponse();
    }

    console.error("updateInventoryLocation error:", error);
    return buildUnexpectedResponse();
  }
}

export async function deactivateInventoryLocation(
  id: unknown,
): Promise<InventoryServiceResult<InventoryLocationDetailResponse>> {
  try {
    const locationId = normalizeInventoryLocationId(id);

    const currentLocation = await findInventoryLocationById(locationId);

    if (!currentLocation) {
      return buildNotFoundResponse();
    }

    if (!currentLocation.is_active) {
      const location = await getLocationDetail(locationId);

      if (!location) {
        return buildNotFoundResponse();
      }

      return {
        status: 200,
        body: {
          success: true,
          data: location,
          message: "La ubicación ya estaba desactivada.",
        },
      };
    }

    const activeChildrenCount =
      await countActiveInventoryLocationChildren(locationId);

    if (activeChildrenCount > 0) {
      return buildActiveChildrenResponse();
    }

    if (await locationHasStock(locationId)) {
      return buildStockExistsResponse();
    }

    await deactivateInventoryLocationRecord(locationId);

    const location = await getLocationDetail(locationId);

    if (!location) {
      return buildNotFoundResponse();
    }

    return {
      status: 200,
      body: {
        success: true,
        data: location,
        message: "Ubicación de inventario desactivada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof InventoryValidationError) {
      return buildValidationResponse(error);
    }

    if (isPrismaRecordNotFoundError(error)) {
      return buildNotFoundResponse();
    }

    console.error("deactivateInventoryLocation error:", error);
    return buildUnexpectedResponse();
  }
}
