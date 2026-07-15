import type {
  OperationalZoneVisitDateCreateData,
  OperationalZoneVisitDateFilters,
  OperationalZoneVisitDateUpdateData,
} from "@/lib/operational-zones/operationalZoneVisitDates.repository";

export class OperationalZoneVisitDatesValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "OperationalZoneVisitDatesValidationError";
    this.status = status;
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeRequiredText(value: unknown, fieldName: string) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    throw new OperationalZoneVisitDatesValidationError(
      `${fieldName} es requerido.`,
    );
  }

  return cleanValue;
}

function normalizeUuid(value: unknown, fieldName: string) {
  const cleanValue = normalizeRequiredText(value, fieldName);

  if (!UUID_PATTERN.test(cleanValue)) {
    throw new OperationalZoneVisitDatesValidationError(
      `${fieldName} no es válido.`,
    );
  }

  return cleanValue;
}

function normalizeDateOnly(value: unknown, fieldName: string) {
  const cleanValue = normalizeRequiredText(value, fieldName);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleanValue);

  if (!match) {
    throw new OperationalZoneVisitDatesValidationError(
      `${fieldName} debe tener el formato YYYY-MM-DD.`,
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const normalizedDate = new Date(Date.UTC(year, month - 1, day));

  const isValidDate =
    normalizedDate.getUTCFullYear() === year &&
    normalizedDate.getUTCMonth() === month - 1 &&
    normalizedDate.getUTCDate() === day;

  if (!isValidDate) {
    throw new OperationalZoneVisitDatesValidationError(
      `${fieldName} no es válida.`,
    );
  }

  return normalizedDate;
}

function normalizeOptionalDateOnly(
  value: unknown,
  fieldName: string,
): Date | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return normalizeDateOnly(value, fieldName);
}

function normalizeBoolean(value: unknown, fieldName: string) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const cleanValue = value.trim().toLowerCase();

    if (cleanValue === "true") {
      return true;
    }

    if (cleanValue === "false") {
      return false;
    }
  }

  throw new OperationalZoneVisitDatesValidationError(
    `${fieldName} no es válido.`,
  );
}

function normalizeOptionalBoolean(
  value: unknown,
  fieldName: string,
): boolean | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return normalizeBoolean(value, fieldName);
}

function normalizeActiveState(input: Record<string, unknown>) {
  if (input.is_active !== undefined) {
    return normalizeBoolean(input.is_active, "El estado activo");
  }

  if (input.action !== undefined) {
    const action = String(input.action ?? "")
      .trim()
      .toLowerCase();

    if (action === "activate") {
      return true;
    }

    if (action === "deactivate") {
      return false;
    }

    throw new OperationalZoneVisitDatesValidationError(
      "La acción debe ser activate o deactivate.",
    );
  }

  throw new OperationalZoneVisitDatesValidationError(
    "Debe indicar el estado de la fecha de visita.",
  );
}

export function normalizeOperationalZoneVisitDateZoneId(value: unknown) {
  return normalizeUuid(value, "El id de la zona operativa");
}

export function normalizeOperationalZoneVisitDateId(value: unknown) {
  return normalizeUuid(value, "El id de la fecha de visita");
}

export function normalizeOperationalZoneVisitDateCreateInput(
  operationalZoneId: unknown,
  input: Record<string, unknown>,
): OperationalZoneVisitDateCreateData {
  return {
    operational_zone_id:
      normalizeOperationalZoneVisitDateZoneId(operationalZoneId),
    visit_date: normalizeDateOnly(input.visit_date, "La fecha de visita"),
  };
}

export function normalizeOperationalZoneVisitDateUpdateInput(params: {
  operationalZoneId: unknown;
  visitDateId: unknown;
  input: Record<string, unknown>;
}): {
  operational_zone_id: string;
  operational_zone_visit_date_id: string;
  data: OperationalZoneVisitDateUpdateData;
} {
  return {
    operational_zone_id: normalizeOperationalZoneVisitDateZoneId(
      params.operationalZoneId,
    ),
    operational_zone_visit_date_id: normalizeOperationalZoneVisitDateId(
      params.visitDateId,
    ),
    data: {
      is_active: normalizeActiveState(params.input),
    },
  };
}

export function normalizeOperationalZoneVisitDateDeleteInput(params: {
  operationalZoneId: unknown;
  visitDateId: unknown;
}) {
  return {
    operational_zone_id: normalizeOperationalZoneVisitDateZoneId(
      params.operationalZoneId,
    ),
    operational_zone_visit_date_id: normalizeOperationalZoneVisitDateId(
      params.visitDateId,
    ),
  };
}

export function normalizeOperationalZoneVisitDateFilters(
  operationalZoneId: unknown,
  searchParams: URLSearchParams,
): OperationalZoneVisitDateFilters {
  const activeOnly = normalizeOptionalBoolean(
    searchParams.get("active_only"),
    "El filtro de estado activo",
  );

  const fromDate = normalizeOptionalDateOnly(
    searchParams.get("from_date"),
    "La fecha inicial",
  );

  const toDate = normalizeOptionalDateOnly(
    searchParams.get("to_date"),
    "La fecha final",
  );

  if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
    throw new OperationalZoneVisitDatesValidationError(
      "La fecha inicial no puede ser posterior a la fecha final.",
    );
  }

  return {
    operational_zone_id:
      normalizeOperationalZoneVisitDateZoneId(operationalZoneId),

    ...(activeOnly === true ? { active_only: true } : {}),
    ...(fromDate ? { from_date: fromDate } : {}),
    ...(toDate ? { to_date: toDate } : {}),
  };
}
