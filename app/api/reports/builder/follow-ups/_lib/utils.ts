import type { Prisma } from "@prisma/client";
import {
  ALLOWED_COLUMNS,
  DEFAULT_COLUMNS,
  type FollowUpReportColumnKey,
} from "./constants";

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return 0;
}

export function parsePositiveInt(
  value: string | null,
  fallback: number,
  max: number,
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export function parsePositiveNumber(value: string | null) {
  if (!value) return null;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function sanitizeColumns(rawColumns: string | null) {
  if (!rawColumns) return [...DEFAULT_COLUMNS];

  const columns = rawColumns
    .split(",")
    .map((column) => column.trim())
    .filter((column): column is FollowUpReportColumnKey =>
      ALLOWED_COLUMNS.has(column as FollowUpReportColumnKey),
    );

  return columns.length > 0 ? columns : [...DEFAULT_COLUMNS];
}

export function getClientName(client: {
  display_name: string | null;
  company_name: string | null;
  commercial_name: string | null;
  first_name: string;
  last_name_1: string;
  last_name_2: string | null;
}) {
  const personName = [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    client.display_name ||
    client.commercial_name ||
    client.company_name ||
    personName ||
    "Cliente sin nombre"
  );
}

export function getPersonName(person: {
  first_name: string;
  last_name_1: string;
  last_name_2: string | null;
}) {
  return [person.first_name, person.last_name_1, person.last_name_2]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function formatDate(value: Date | null) {
  if (!value) return "";

  return value.toISOString();
}

export function parseDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function parseEndDate(value: string | null) {
  const date = parseDate(value);

  if (!date) return null;

  date.setHours(23, 59, 59, 999);

  return date;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildDateTimeFilter(
  fromValue: string | null,
  toValue: string | null,
): Prisma.DateTimeFilter<"FollowUp"> | null {
  const from = parseDate(fromValue);
  const to = parseEndDate(toValue);

  if (!from && !to) return null;

  const filter: Prisma.DateTimeFilter<"FollowUp"> = {};

  if (from) {
    filter.gte = from;
  }

  if (to) {
    filter.lte = to;
  }

  return filter;
}

function buildNullableDateTimeFilter(
  fromValue: string | null,
  toValue: string | null,
): Prisma.DateTimeNullableFilter<"FollowUp"> | null {
  const from = parseDate(fromValue);
  const to = parseEndDate(toValue);

  if (!from && !to) return null;

  const filter: Prisma.DateTimeNullableFilter<"FollowUp"> = {};

  if (from) {
    filter.gte = from;
  }

  if (to) {
    filter.lte = to;
  }

  return filter;
}

export function applyDateRange(
  target: Prisma.FollowUpWhereInput,
  field:
    | "target_date"
    | "due_date"
    | "scheduled_date"
    | "completed_at"
    | "created_at"
    | "updated_at",
  fromValue: string | null,
  toValue: string | null,
) {
  switch (field) {
    case "target_date": {
      const filter = buildDateTimeFilter(fromValue, toValue);
      if (filter) target.target_date = filter;
      break;
    }

    case "due_date": {
      const filter = buildNullableDateTimeFilter(fromValue, toValue);
      if (filter) target.due_date = filter;
      break;
    }

    case "scheduled_date": {
      const filter = buildNullableDateTimeFilter(fromValue, toValue);
      if (filter) target.scheduled_date = filter;
      break;
    }

    case "completed_at": {
      const filter = buildNullableDateTimeFilter(fromValue, toValue);
      if (filter) target.completed_at = filter;
      break;
    }

    case "created_at": {
      const filter = buildDateTimeFilter(fromValue, toValue);
      if (filter) target.created_at = filter;
      break;
    }

    case "updated_at": {
      const filter = buildDateTimeFilter(fromValue, toValue);
      if (filter) target.updated_at = filter;
      break;
    }

    default:
      break;
  }
}
