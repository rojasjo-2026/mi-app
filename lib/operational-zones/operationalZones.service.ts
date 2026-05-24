import { Prisma, type OperationalZone } from "@prisma/client";

import {
  activateOperationalZone,
  createOperationalZone as createOperationalZoneRecord,
  deactivateOperationalZone,
  findOperationalZoneByCountryAndName,
  findOperationalZoneById,
  findOperationalZones,
  updateOperationalZone as updateOperationalZoneRecord,
  type OperationalZoneFilters,
} from "@/lib/operational-zones/operationalZones.repository";

import {
  normalizeOperationalZoneCreateInput,
  normalizeOperationalZoneFilters,
  normalizeOperationalZoneId,
  normalizeOperationalZoneUpdateInput,
  OperationalZonesValidationError,
} from "@/lib/operational-zones/operationalZones.validators";

type OperationalZonesServiceResult<T> = {
  status: number;
  body: {
    success: boolean;
    data?: T;
    message?: string;
  };
};

type OperationalZoneResponse = {
  operational_zone_id: string;
  country_code: string;
  name: string;
  description: string | null;
  reference_address: string | null;
  latitude: string | null;
  longitude: string | null;
  radius_km: string | null;
  color_label: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapOperationalZone(zone: OperationalZone): OperationalZoneResponse {
  return {
    operational_zone_id: zone.operational_zone_id,
    country_code: zone.country_code,
    name: zone.name,
    description: zone.description,
    reference_address: zone.reference_address,
    latitude: zone.latitude?.toString() ?? null,
    longitude: zone.longitude?.toString() ?? null,
    radius_km: zone.radius_km?.toString() ?? null,
    color_label: zone.color_label,
    sort_order: zone.sort_order,
    is_active: zone.is_active,
    created_at: zone.created_at.toISOString(),
    updated_at: zone.updated_at.toISOString(),
  };
}

function mapOperationalZones(zones: OperationalZone[]) {
  return zones.map(mapOperationalZone);
}

function buildValidationErrorResponse<T>(
  error: OperationalZonesValidationError,
): OperationalZonesServiceResult<T> {
  return {
    status: error.status,
    body: {
      success: false,
      message: error.message,
    },
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function buildUnexpectedErrorResponse<T>(): OperationalZonesServiceResult<T> {
  return {
    status: 500,
    body: {
      success: false,
      message: "Ocurrió un error al procesar la zona operativa.",
    },
  };
}

export async function getOperationalZones(
  filters: OperationalZoneFilters,
): Promise<OperationalZonesServiceResult<OperationalZoneResponse[]>> {
  const zones = await findOperationalZones(filters);

  return {
    status: 200,
    body: {
      success: true,
      data: mapOperationalZones(zones),
      message:
        zones.length === 0
          ? "No hay zonas operativas configuradas todavía."
          : undefined,
    },
  };
}

export async function getOperationalZonesFromSearchParams(
  searchParams: URLSearchParams,
): Promise<OperationalZonesServiceResult<OperationalZoneResponse[]>> {
  const filters = normalizeOperationalZoneFilters(searchParams);

  return getOperationalZones(filters);
}

export async function createOperationalZone(
  input: Record<string, unknown>,
): Promise<OperationalZonesServiceResult<OperationalZoneResponse>> {
  try {
    const normalizedInput = normalizeOperationalZoneCreateInput(input);

    const existingZone = await findOperationalZoneByCountryAndName({
      country_code: normalizedInput.country_code,
      name: normalizedInput.name,
    });

    if (existingZone) {
      return {
        status: 409,
        body: {
          success: false,
          message:
            "Ya existe una zona operativa con ese nombre para el país seleccionado.",
          data: mapOperationalZone(existingZone),
        },
      };
    }

    const createdZone = await createOperationalZoneRecord(normalizedInput);

    return {
      status: 201,
      body: {
        success: true,
        data: mapOperationalZone(createdZone),
        message: "Zona operativa creada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof OperationalZonesValidationError) {
      return buildValidationErrorResponse(error);
    }

    if (isUniqueConstraintError(error)) {
      return {
        status: 409,
        body: {
          success: false,
          message:
            "Ya existe una zona operativa con ese nombre para el país seleccionado.",
        },
      };
    }

    console.error("createOperationalZone error:", error);
    return buildUnexpectedErrorResponse();
  }
}

export async function updateOperationalZone(
  input: Record<string, unknown>,
): Promise<OperationalZonesServiceResult<OperationalZoneResponse>> {
  try {
    const { operational_zone_id, data } =
      normalizeOperationalZoneUpdateInput(input);

    const currentZone = await findOperationalZoneById(operational_zone_id);

    if (!currentZone) {
      return {
        status: 404,
        body: {
          success: false,
          message: "No se encontró la zona operativa.",
        },
      };
    }

    const nextCountryCode = data.country_code ?? currentZone.country_code;
    const nextName = data.name ?? currentZone.name;

    const existingZone = await findOperationalZoneByCountryAndName({
      country_code: nextCountryCode,
      name: nextName,
    });

    if (
      existingZone &&
      existingZone.operational_zone_id !== currentZone.operational_zone_id
    ) {
      return {
        status: 409,
        body: {
          success: false,
          message:
            "Ya existe otra zona operativa con ese nombre para el país seleccionado.",
        },
      };
    }

    const updatedZone = await updateOperationalZoneRecord(
      operational_zone_id,
      data,
    );

    return {
      status: 200,
      body: {
        success: true,
        data: mapOperationalZone(updatedZone),
        message: "Zona operativa actualizada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof OperationalZonesValidationError) {
      return buildValidationErrorResponse(error);
    }

    if (isUniqueConstraintError(error)) {
      return {
        status: 409,
        body: {
          success: false,
          message:
            "Ya existe una zona operativa con ese nombre para el país seleccionado.",
        },
      };
    }

    console.error("updateOperationalZone error:", error);
    return buildUnexpectedErrorResponse();
  }
}

export async function activateOperationalZoneById(
  id: unknown,
): Promise<OperationalZonesServiceResult<OperationalZoneResponse>> {
  try {
    const operationalZoneId = normalizeOperationalZoneId(id);

    const existingZone = await findOperationalZoneById(operationalZoneId);

    if (!existingZone) {
      return {
        status: 404,
        body: {
          success: false,
          message: "No se encontró la zona operativa.",
        },
      };
    }

    const updatedZone = await activateOperationalZone(operationalZoneId);

    return {
      status: 200,
      body: {
        success: true,
        data: mapOperationalZone(updatedZone),
        message: "Zona operativa activada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof OperationalZonesValidationError) {
      return buildValidationErrorResponse(error);
    }

    console.error("activateOperationalZoneById error:", error);
    return buildUnexpectedErrorResponse();
  }
}

export async function deactivateOperationalZoneById(
  id: unknown,
): Promise<OperationalZonesServiceResult<OperationalZoneResponse>> {
  try {
    const operationalZoneId = normalizeOperationalZoneId(id);

    const existingZone = await findOperationalZoneById(operationalZoneId);

    if (!existingZone) {
      return {
        status: 404,
        body: {
          success: false,
          message: "No se encontró la zona operativa.",
        },
      };
    }

    const updatedZone = await deactivateOperationalZone(operationalZoneId);

    return {
      status: 200,
      body: {
        success: true,
        data: mapOperationalZone(updatedZone),
        message: "Zona operativa desactivada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof OperationalZonesValidationError) {
      return buildValidationErrorResponse(error);
    }

    console.error("deactivateOperationalZoneById error:", error);
    return buildUnexpectedErrorResponse();
  }
}

/**
 * Por seguridad, esta función NO elimina físicamente la zona.
 * Solo la desactiva para no romper clientes, instalaciones o mantenimientos relacionados.
 */
export async function deleteOperationalZoneById(
  id: unknown,
): Promise<OperationalZonesServiceResult<OperationalZoneResponse>> {
  return deactivateOperationalZoneById(id);
}
