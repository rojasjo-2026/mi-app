import { Prisma, type OperationalZoneVisitDate } from "@prisma/client";

import { findOperationalZoneById } from "@/lib/operational-zones/operationalZones.repository";

import {
  activateOperationalZoneVisitDate,
  createOperationalZoneVisitDate as createOperationalZoneVisitDateRecord,
  deactivateOperationalZoneVisitDate,
  deleteOperationalZoneVisitDate as deleteOperationalZoneVisitDateRecord,
  findOperationalZoneVisitDateByIdAndZone,
  findOperationalZoneVisitDateByZoneAndDate,
  findOperationalZoneVisitDates,
  type OperationalZoneVisitDateFilters,
} from "@/lib/operational-zones/operationalZoneVisitDates.repository";

import {
  normalizeOperationalZoneVisitDateCreateInput,
  normalizeOperationalZoneVisitDateDeleteInput,
  normalizeOperationalZoneVisitDateFilters,
  normalizeOperationalZoneVisitDateUpdateInput,
  OperationalZoneVisitDatesValidationError,
} from "@/lib/operational-zones/operationalZoneVisitDates.validators";

type OperationalZoneVisitDatesServiceResult<T> = {
  status: number;
  body: {
    success: boolean;
    data?: T;
    message?: string;
  };
};

type OperationalZoneVisitDateResponse = {
  operational_zone_visit_date_id: string;
  operational_zone_id: string;
  visit_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapOperationalZoneVisitDate(
  visitDate: OperationalZoneVisitDate,
): OperationalZoneVisitDateResponse {
  return {
    operational_zone_visit_date_id: visitDate.operational_zone_visit_date_id,
    operational_zone_id: visitDate.operational_zone_id,
    visit_date: visitDate.visit_date.toISOString().slice(0, 10),
    is_active: visitDate.is_active,
    created_at: visitDate.created_at.toISOString(),
    updated_at: visitDate.updated_at.toISOString(),
  };
}

function mapOperationalZoneVisitDates(visitDates: OperationalZoneVisitDate[]) {
  return visitDates.map(mapOperationalZoneVisitDate);
}

function buildValidationErrorResponse<T>(
  error: OperationalZoneVisitDatesValidationError,
): OperationalZoneVisitDatesServiceResult<T> {
  return {
    status: error.status,
    body: {
      success: false,
      message: error.message,
    },
  };
}

function buildUnexpectedErrorResponse<
  T,
>(): OperationalZoneVisitDatesServiceResult<T> {
  return {
    status: 500,
    body: {
      success: false,
      message: "Ocurrió un error al procesar la fecha de visita.",
    },
  };
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isRecordNotFoundError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

async function validateOperationalZoneExists(
  operationalZoneId: string,
): Promise<
  | {
      exists: true;
    }
  | {
      exists: false;
      result: OperationalZoneVisitDatesServiceResult<never>;
    }
> {
  const zone = await findOperationalZoneById(operationalZoneId);

  if (!zone) {
    return {
      exists: false,
      result: {
        status: 404,
        body: {
          success: false,
          message: "No se encontró la zona operativa.",
        },
      },
    };
  }

  return {
    exists: true,
  };
}

export async function getOperationalZoneVisitDates(
  filters: OperationalZoneVisitDateFilters,
): Promise<
  OperationalZoneVisitDatesServiceResult<OperationalZoneVisitDateResponse[]>
> {
  try {
    const zoneValidation = await validateOperationalZoneExists(
      filters.operational_zone_id,
    );

    if (!zoneValidation.exists) {
      return zoneValidation.result;
    }

    const visitDates = await findOperationalZoneVisitDates(filters);

    return {
      status: 200,
      body: {
        success: true,
        data: mapOperationalZoneVisitDates(visitDates),
        message:
          visitDates.length === 0
            ? "No hay fechas de visita configuradas para esta zona."
            : undefined,
      },
    };
  } catch (error) {
    console.error("getOperationalZoneVisitDates error:", error);
    return buildUnexpectedErrorResponse();
  }
}

export async function getOperationalZoneVisitDatesFromSearchParams(
  operationalZoneId: unknown,
  searchParams: URLSearchParams,
): Promise<
  OperationalZoneVisitDatesServiceResult<OperationalZoneVisitDateResponse[]>
> {
  try {
    const filters = normalizeOperationalZoneVisitDateFilters(
      operationalZoneId,
      searchParams,
    );

    return getOperationalZoneVisitDates(filters);
  } catch (error) {
    if (error instanceof OperationalZoneVisitDatesValidationError) {
      return buildValidationErrorResponse(error);
    }

    console.error("getOperationalZoneVisitDatesFromSearchParams error:", error);

    return buildUnexpectedErrorResponse();
  }
}

export async function createOperationalZoneVisitDate(
  operationalZoneId: unknown,
  input: Record<string, unknown>,
): Promise<
  OperationalZoneVisitDatesServiceResult<OperationalZoneVisitDateResponse>
> {
  try {
    const normalizedInput = normalizeOperationalZoneVisitDateCreateInput(
      operationalZoneId,
      input,
    );

    const zoneValidation = await validateOperationalZoneExists(
      normalizedInput.operational_zone_id,
    );

    if (!zoneValidation.exists) {
      return zoneValidation.result;
    }

    const existingVisitDate = await findOperationalZoneVisitDateByZoneAndDate({
      operational_zone_id: normalizedInput.operational_zone_id,
      visit_date: normalizedInput.visit_date,
    });

    if (existingVisitDate) {
      return {
        status: 409,
        body: {
          success: false,
          data: mapOperationalZoneVisitDate(existingVisitDate),
          message:
            "Esta fecha de visita ya está configurada para la zona operativa.",
        },
      };
    }

    const createdVisitDate =
      await createOperationalZoneVisitDateRecord(normalizedInput);

    return {
      status: 201,
      body: {
        success: true,
        data: mapOperationalZoneVisitDate(createdVisitDate),
        message: "Fecha de visita creada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof OperationalZoneVisitDatesValidationError) {
      return buildValidationErrorResponse(error);
    }

    if (isUniqueConstraintError(error)) {
      return {
        status: 409,
        body: {
          success: false,
          message:
            "Esta fecha de visita ya está configurada para la zona operativa.",
        },
      };
    }

    console.error("createOperationalZoneVisitDate error:", error);
    return buildUnexpectedErrorResponse();
  }
}

export async function updateOperationalZoneVisitDate(
  params: {
    operationalZoneId: unknown;
    visitDateId: unknown;
  },
  input: Record<string, unknown>,
): Promise<
  OperationalZoneVisitDatesServiceResult<OperationalZoneVisitDateResponse>
> {
  try {
    const normalizedInput = normalizeOperationalZoneVisitDateUpdateInput({
      operationalZoneId: params.operationalZoneId,
      visitDateId: params.visitDateId,
      input,
    });

    const zoneValidation = await validateOperationalZoneExists(
      normalizedInput.operational_zone_id,
    );

    if (!zoneValidation.exists) {
      return zoneValidation.result;
    }

    const existingVisitDate = await findOperationalZoneVisitDateByIdAndZone({
      operational_zone_visit_date_id:
        normalizedInput.operational_zone_visit_date_id,
      operational_zone_id: normalizedInput.operational_zone_id,
    });

    if (!existingVisitDate) {
      return {
        status: 404,
        body: {
          success: false,
          message:
            "No se encontró la fecha de visita para esta zona operativa.",
        },
      };
    }

    const updatedVisitDate =
      normalizedInput.data.is_active === true
        ? await activateOperationalZoneVisitDate(
            normalizedInput.operational_zone_visit_date_id,
          )
        : await deactivateOperationalZoneVisitDate(
            normalizedInput.operational_zone_visit_date_id,
          );

    return {
      status: 200,
      body: {
        success: true,
        data: mapOperationalZoneVisitDate(updatedVisitDate),
        message: updatedVisitDate.is_active
          ? "Fecha de visita activada correctamente."
          : "Fecha de visita desactivada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof OperationalZoneVisitDatesValidationError) {
      return buildValidationErrorResponse(error);
    }

    if (isRecordNotFoundError(error)) {
      return {
        status: 404,
        body: {
          success: false,
          message:
            "No se encontró la fecha de visita para esta zona operativa.",
        },
      };
    }

    console.error("updateOperationalZoneVisitDate error:", error);
    return buildUnexpectedErrorResponse();
  }
}

export async function deleteOperationalZoneVisitDate(params: {
  operationalZoneId: unknown;
  visitDateId: unknown;
}): Promise<
  OperationalZoneVisitDatesServiceResult<OperationalZoneVisitDateResponse>
> {
  try {
    const normalizedInput = normalizeOperationalZoneVisitDateDeleteInput({
      operationalZoneId: params.operationalZoneId,
      visitDateId: params.visitDateId,
    });

    const zoneValidation = await validateOperationalZoneExists(
      normalizedInput.operational_zone_id,
    );

    if (!zoneValidation.exists) {
      return zoneValidation.result;
    }

    const existingVisitDate = await findOperationalZoneVisitDateByIdAndZone({
      operational_zone_visit_date_id:
        normalizedInput.operational_zone_visit_date_id,
      operational_zone_id: normalizedInput.operational_zone_id,
    });

    if (!existingVisitDate) {
      return {
        status: 404,
        body: {
          success: false,
          message:
            "No se encontró la fecha de visita para esta zona operativa.",
        },
      };
    }

    const deletedVisitDate = await deleteOperationalZoneVisitDateRecord(
      normalizedInput.operational_zone_visit_date_id,
    );

    return {
      status: 200,
      body: {
        success: true,
        data: mapOperationalZoneVisitDate(deletedVisitDate),
        message: "Fecha de visita eliminada correctamente.",
      },
    };
  } catch (error) {
    if (error instanceof OperationalZoneVisitDatesValidationError) {
      return buildValidationErrorResponse(error);
    }

    if (isRecordNotFoundError(error)) {
      return {
        status: 404,
        body: {
          success: false,
          message:
            "No se encontró la fecha de visita para esta zona operativa.",
        },
      };
    }

    console.error("deleteOperationalZoneVisitDate error:", error);
    return buildUnexpectedErrorResponse();
  }
}
