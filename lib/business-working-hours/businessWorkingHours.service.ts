import { prisma } from "@/lib/prisma";

import {
  mapBusinessWorkingHour,
  mapBusinessWorkingHours,
} from "@/lib/business-working-hours/businessWorkingHours.mapper";

import type {
  BusinessWorkingHourCreateInput,
  BusinessWorkingHoursFilters,
  BusinessWorkingHoursServiceResult,
  BusinessWorkingHourUpdateInput,
  BusinessWorkingHourResponse,
} from "@/lib/business-working-hours/businessWorkingHours.types";

import {
  BusinessWorkingHoursValidationError,
  normalizeBusinessWorkingHourCreateInput,
  normalizeBusinessWorkingHourUpdateInput,
  validateMergedBusinessWorkingHourValues,
} from "@/lib/business-working-hours/businessWorkingHours.validators";

function buildValidationErrorResponse(
  error: BusinessWorkingHoursValidationError,
) {
  return {
    status: error.status,
    body: {
      success: false,
      message: error.message,
    },
  };
}

export async function getBusinessWorkingHours(
  filters: BusinessWorkingHoursFilters,
): Promise<BusinessWorkingHoursServiceResult<BusinessWorkingHourResponse[]>> {
  const workingHours = await prisma.businessWorkingHour.findMany({
    where: {
      ...(filters.country_code ? { country_code: filters.country_code } : {}),
      ...(filters.active_only ? { is_active: true } : {}),
    },
    orderBy: [{ country_code: "asc" }, { day_of_week: "asc" }],
  });

  return {
    status: 200,
    body: {
      success: true,
      data: mapBusinessWorkingHours(workingHours),
      message:
        workingHours.length === 0
          ? "No working hours have been configured yet."
          : undefined,
    },
  };
}

export async function createBusinessWorkingHour(
  input: BusinessWorkingHourCreateInput,
): Promise<BusinessWorkingHoursServiceResult<BusinessWorkingHourResponse>> {
  try {
    const normalizedInput = normalizeBusinessWorkingHourCreateInput(input);

    const existingWorkingHour = await prisma.businessWorkingHour.findFirst({
      where: {
        day_of_week: normalizedInput.day_of_week,
        country_code: normalizedInput.country_code,
      },
    });

    if (existingWorkingHour) {
      return {
        status: 409,
        body: {
          success: false,
          message:
            "A working hour configuration already exists for this day and country.",
          data: mapBusinessWorkingHour(existingWorkingHour),
        },
      };
    }

    const createdWorkingHour = await prisma.businessWorkingHour.create({
      data: normalizedInput,
    });

    return {
      status: 201,
      body: {
        success: true,
        data: mapBusinessWorkingHour(createdWorkingHour),
      },
    };
  } catch (error) {
    if (error instanceof BusinessWorkingHoursValidationError) {
      return buildValidationErrorResponse(error);
    }

    throw error;
  }
}

export async function updateBusinessWorkingHour(
  input: BusinessWorkingHourUpdateInput,
): Promise<BusinessWorkingHoursServiceResult<BusinessWorkingHourResponse>> {
  try {
    const normalizedInput = normalizeBusinessWorkingHourUpdateInput(input);

    const currentWorkingHour = await prisma.businessWorkingHour.findUnique({
      where: {
        business_working_hour_id: normalizedInput.id,
      },
    });

    if (!currentWorkingHour) {
      return {
        status: 404,
        body: {
          success: false,
          message: "Working hour configuration not found.",
        },
      };
    }

    const nextValues = {
      day_of_week:
        normalizedInput.day_of_week ?? currentWorkingHour.day_of_week,
      country_code:
        normalizedInput.country_code ?? currentWorkingHour.country_code,
      is_working_day:
        normalizedInput.is_working_day ?? currentWorkingHour.is_working_day,
      start_time:
        normalizedInput.start_time !== undefined
          ? normalizedInput.start_time
          : currentWorkingHour.start_time,
      end_time:
        normalizedInput.end_time !== undefined
          ? normalizedInput.end_time
          : currentWorkingHour.end_time,
      break_start_time:
        normalizedInput.break_start_time !== undefined
          ? normalizedInput.break_start_time
          : currentWorkingHour.break_start_time,
      break_end_time:
        normalizedInput.break_end_time !== undefined
          ? normalizedInput.break_end_time
          : currentWorkingHour.break_end_time,
      notes:
        normalizedInput.notes !== undefined
          ? normalizedInput.notes
          : currentWorkingHour.notes,
      is_active:
        normalizedInput.is_active !== undefined
          ? normalizedInput.is_active
          : currentWorkingHour.is_active,
    };

    validateMergedBusinessWorkingHourValues({
      is_working_day: nextValues.is_working_day,
      start_time: nextValues.start_time,
      end_time: nextValues.end_time,
      break_start_time: nextValues.break_start_time,
      break_end_time: nextValues.break_end_time,
    });

    const duplicateWorkingHour = await prisma.businessWorkingHour.findFirst({
      where: {
        day_of_week: nextValues.day_of_week,
        country_code: nextValues.country_code,
        NOT: {
          business_working_hour_id: normalizedInput.id,
        },
      },
    });

    if (duplicateWorkingHour) {
      return {
        status: 409,
        body: {
          success: false,
          message:
            "Another working hour configuration already exists for this day and country.",
        },
      };
    }

    const updatedWorkingHour = await prisma.businessWorkingHour.update({
      where: {
        business_working_hour_id: normalizedInput.id,
      },
      data: {
        day_of_week: nextValues.day_of_week,
        country_code: nextValues.country_code,
        is_working_day: nextValues.is_working_day,
        start_time: nextValues.is_working_day ? nextValues.start_time : null,
        end_time: nextValues.is_working_day ? nextValues.end_time : null,
        break_start_time: nextValues.is_working_day
          ? nextValues.break_start_time
          : null,
        break_end_time: nextValues.is_working_day
          ? nextValues.break_end_time
          : null,
        notes: nextValues.notes,
        is_active: nextValues.is_active,
      },
    });

    return {
      status: 200,
      body: {
        success: true,
        data: mapBusinessWorkingHour(updatedWorkingHour),
      },
    };
  } catch (error) {
    if (error instanceof BusinessWorkingHoursValidationError) {
      return buildValidationErrorResponse(error);
    }

    throw error;
  }
}

export async function deleteBusinessWorkingHour(
  id: unknown,
): Promise<BusinessWorkingHoursServiceResult<{ id: string }>> {
  const cleanId = String(id || "").trim();

  if (!cleanId) {
    return {
      status: 400,
      body: {
        success: false,
        message: "Working hour id is required.",
      },
    };
  }

  const existingWorkingHour = await prisma.businessWorkingHour.findUnique({
    where: {
      business_working_hour_id: cleanId,
    },
  });

  if (!existingWorkingHour) {
    return {
      status: 404,
      body: {
        success: false,
        message: "Working hour configuration not found.",
      },
    };
  }

  await prisma.businessWorkingHour.delete({
    where: {
      business_working_hour_id: cleanId,
    },
  });

  return {
    status: 200,
    body: {
      success: true,
      data: {
        id: cleanId,
      },
    },
  };
}
