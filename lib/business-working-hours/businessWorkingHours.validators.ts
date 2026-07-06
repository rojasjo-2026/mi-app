import { BusinessWeekDay } from "@prisma/client";

import {
  DEFAULT_COUNTRY_CODE,
  normalizeCountryCode as normalizeConfiguredCountryCode,
} from "@/lib/config/app-settings";
import type {
  BusinessWorkingHourCreateInput,
  BusinessWorkingHourUpdateInput,
  BusinessWorkingHoursFilters,
  NormalizedBusinessWorkingHourCreateInput,
  NormalizedBusinessWorkingHourUpdateInput,
} from "@/lib/business-working-hours/businessWorkingHours.types";

const validTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class BusinessWorkingHoursValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "BusinessWorkingHoursValidationError";
    this.status = status;
  }
}

export function normalizeCountryCode(value: unknown) {
  const rawCountryCode = String(value || "").trim();

  return normalizeConfiguredCountryCode(rawCountryCode, DEFAULT_COUNTRY_CODE);
}

export function normalizeWeekDay(value: unknown) {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase();

  const validDays = Object.values(BusinessWeekDay);

  if (validDays.includes(normalizedValue as BusinessWeekDay)) {
    return normalizedValue as BusinessWeekDay;
  }

  return null;
}

export function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  return null;
}

export function normalizeOptionalBoolean(value: unknown) {
  if (value === undefined) return undefined;

  return normalizeBoolean(value);
}

export function normalizeOptionalTime(value: unknown) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return null;

  if (!validTimePattern.test(cleanValue)) {
    return undefined;
  }

  return cleanValue;
}

function normalizeNotes(value: unknown) {
  const cleanValue = String(value || "").trim();

  return cleanValue || null;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function throwInvalidTimeFormat(): never {
  throw new BusinessWorkingHoursValidationError(
    "Invalid time format. Use HH:mm format.",
  );
}

function validateWorkingTimeRange(
  isWorkingDay: boolean,
  startTime: string | null,
  endTime: string | null,
) {
  if (!isWorkingDay) return;

  if (!startTime || !endTime) {
    throw new BusinessWorkingHoursValidationError(
      "Start time and end time are required for working days.",
    );
  }

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    throw new BusinessWorkingHoursValidationError(
      "Start time must be earlier than end time.",
    );
  }
}

function validateBreakTimeRange(
  isWorkingDay: boolean,
  startTime: string | null,
  endTime: string | null,
  breakStartTime: string | null,
  breakEndTime: string | null,
) {
  if (!isWorkingDay) return;

  const hasBreakStart = Boolean(breakStartTime);
  const hasBreakEnd = Boolean(breakEndTime);

  if (hasBreakStart !== hasBreakEnd) {
    throw new BusinessWorkingHoursValidationError(
      "Break start time and break end time must be provided together.",
    );
  }

  if (!breakStartTime || !breakEndTime || !startTime || !endTime) return;

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const breakStartMinutes = timeToMinutes(breakStartTime);
  const breakEndMinutes = timeToMinutes(breakEndTime);

  if (breakStartMinutes >= breakEndMinutes) {
    throw new BusinessWorkingHoursValidationError(
      "Break start time must be earlier than break end time.",
    );
  }

  if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
    throw new BusinessWorkingHoursValidationError(
      "Break time must be within the working time range.",
    );
  }
}

export function normalizeBusinessWorkingHourCreateInput(
  input: BusinessWorkingHourCreateInput,
): NormalizedBusinessWorkingHourCreateInput {
  const dayOfWeek = normalizeWeekDay(input.day_of_week);

  if (!dayOfWeek) {
    throw new BusinessWorkingHoursValidationError("Invalid day of week.");
  }

  const normalizedIsWorkingDay = normalizeBoolean(input.is_working_day);

  if (normalizedIsWorkingDay === null) {
    throw new BusinessWorkingHoursValidationError(
      "Working day value is required.",
    );
  }

  const startTime = normalizeOptionalTime(input.start_time);
  const endTime = normalizeOptionalTime(input.end_time);
  const breakStartTime = normalizeOptionalTime(input.break_start_time);
  const breakEndTime = normalizeOptionalTime(input.break_end_time);

  if (
    startTime === undefined ||
    endTime === undefined ||
    breakStartTime === undefined ||
    breakEndTime === undefined
  ) {
    throwInvalidTimeFormat();
  }

  validateWorkingTimeRange(normalizedIsWorkingDay, startTime, endTime);
  validateBreakTimeRange(
    normalizedIsWorkingDay,
    startTime,
    endTime,
    breakStartTime,
    breakEndTime,
  );

  return {
    day_of_week: dayOfWeek,
    country_code: normalizeCountryCode(input.country_code),
    is_working_day: normalizedIsWorkingDay,
    start_time: normalizedIsWorkingDay ? startTime : null,
    end_time: normalizedIsWorkingDay ? endTime : null,
    break_start_time: normalizedIsWorkingDay ? breakStartTime : null,
    break_end_time: normalizedIsWorkingDay ? breakEndTime : null,
    notes: normalizeNotes(input.notes),
  };
}

export function normalizeBusinessWorkingHourUpdateInput(
  input: BusinessWorkingHourUpdateInput,
): NormalizedBusinessWorkingHourUpdateInput {
  const id = String(input.id || "").trim();

  if (!id) {
    throw new BusinessWorkingHoursValidationError(
      "Working hour id is required.",
    );
  }

  const normalizedInput: NormalizedBusinessWorkingHourUpdateInput = {
    id,
  };

  if (input.day_of_week !== undefined) {
    const dayOfWeek = normalizeWeekDay(input.day_of_week);

    if (!dayOfWeek) {
      throw new BusinessWorkingHoursValidationError("Invalid day of week.");
    }

    normalizedInput.day_of_week = dayOfWeek;
  }

  if (input.country_code !== undefined) {
    normalizedInput.country_code = normalizeCountryCode(input.country_code);
  }

  if (input.is_working_day !== undefined) {
    const isWorkingDay = normalizeBoolean(input.is_working_day);

    if (isWorkingDay === null) {
      throw new BusinessWorkingHoursValidationError(
        "Invalid working day value.",
      );
    }

    normalizedInput.is_working_day = isWorkingDay;
  }

  if (input.start_time !== undefined) {
    const startTime = normalizeOptionalTime(input.start_time);

    if (startTime === undefined) {
      throwInvalidTimeFormat();
    }

    normalizedInput.start_time = startTime;
  }

  if (input.end_time !== undefined) {
    const endTime = normalizeOptionalTime(input.end_time);

    if (endTime === undefined) {
      throwInvalidTimeFormat();
    }

    normalizedInput.end_time = endTime;
  }

  if (input.break_start_time !== undefined) {
    const breakStartTime = normalizeOptionalTime(input.break_start_time);

    if (breakStartTime === undefined) {
      throwInvalidTimeFormat();
    }

    normalizedInput.break_start_time = breakStartTime;
  }

  if (input.break_end_time !== undefined) {
    const breakEndTime = normalizeOptionalTime(input.break_end_time);

    if (breakEndTime === undefined) {
      throwInvalidTimeFormat();
    }

    normalizedInput.break_end_time = breakEndTime;
  }

  if (input.notes !== undefined) {
    normalizedInput.notes = normalizeNotes(input.notes);
  }

  if (input.is_active !== undefined) {
    const isActive = normalizeBoolean(input.is_active);

    if (isActive === null) {
      throw new BusinessWorkingHoursValidationError("Invalid active value.");
    }

    normalizedInput.is_active = isActive;
  }

  return normalizedInput;
}

export function validateMergedBusinessWorkingHourValues(params: {
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
}) {
  validateWorkingTimeRange(
    params.is_working_day,
    params.start_time,
    params.end_time,
  );

  validateBreakTimeRange(
    params.is_working_day,
    params.start_time,
    params.end_time,
    params.break_start_time,
    params.break_end_time,
  );
}

export function normalizeBusinessWorkingHoursFilters(
  searchParams: URLSearchParams,
): BusinessWorkingHoursFilters {
  const countryCode = searchParams.get("country_code");
  const activeOnly = searchParams.get("active_only");

  return {
    ...(countryCode ? { country_code: normalizeCountryCode(countryCode) } : {}),
    ...(activeOnly === "true" ? { active_only: true } : {}),
  };
}
