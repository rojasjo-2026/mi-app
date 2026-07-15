import { NextResponse } from "next/server";
import type {
  ActivityLogAction,
  ActivityLogCategory,
  ActivityLogVisibility,
} from "@prisma/client";

import {
  countActivityLogs,
  findActivityLogs,
} from "@/lib/repositories/activityLogRepository";

const VALID_CATEGORIES = [
  "CLIENT",
  "INSTALLATION",
  "FOLLOW_UP",
  "CONTACT",
  "FILE",
  "FINANCE",
  "SYSTEM",
] as const;

const VALID_ACTIONS: readonly ActivityLogAction[] = [
  "CREATED",
  "UPDATED",
  "DELETED",
  "STATUS_CHANGED",
  "NOTE_ADDED",
  "FILE_ADDED",
  "FILE_REMOVED",
  "CONTACT_REGISTERED",
  "CONTACT_MESSAGE_SENT",
  "INVOICE_CREATED",
  "INVOICE_UPDATED",
  "PAYMENT_REGISTERED",
  "SYSTEM_EVENT",
];

const CLIENT_HISTORY_VISIBILITIES: ActivityLogVisibility[] = [
  "PUBLIC_INTERNAL",
  "STAFF_ONLY",
  "ADMIN_ONLY",
  "FINANCE_ONLY",
];

function normalizeTake(value: string | null) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return 50;
  }

  return Math.min(Math.max(Math.trunc(parsedValue), 1), 100);
}

function normalizeSkip(value: string | null) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.max(Math.trunc(parsedValue), 0);
}

function normalizeCategory(
  value: string | null,
): ActivityLogCategory | undefined {
  if (!value) return undefined;

  const normalizedValue = value.trim().toUpperCase();

  if (!VALID_CATEGORIES.includes(normalizedValue as ActivityLogCategory)) {
    return undefined;
  }

  return normalizedValue as ActivityLogCategory;
}

function normalizeAction(value: string | null): ActivityLogAction | undefined {
  if (!value) return undefined;

  const normalizedValue = value.trim().toUpperCase();

  if (!VALID_ACTIONS.includes(normalizedValue as ActivityLogAction)) {
    return undefined;
  }

  return normalizedValue as ActivityLogAction;
}

function normalizeSearch(value: string | null) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) return undefined;

  return normalizedValue.slice(0, 120);
}

function normalizeDate(value: string | null, endOfDay = false) {
  if (!value) return undefined;

  const normalizedValue = value.trim();

  const date = /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)
    ? new Date(
        `${normalizedValue}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`,
      )
    : new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const clientId = searchParams.get("client_id")?.trim() || undefined;
    const entityType = searchParams.get("entity_type")?.trim() || undefined;
    const entityId = searchParams.get("entity_id")?.trim() || undefined;
    const category = normalizeCategory(searchParams.get("category"));
    const action = normalizeAction(searchParams.get("action"));
    const search = normalizeSearch(searchParams.get("search"));
    const dateFrom = normalizeDate(searchParams.get("date_from"));
    const dateTo = normalizeDate(searchParams.get("date_to"), true);
    const take = normalizeTake(searchParams.get("take"));
    const skip = normalizeSkip(searchParams.get("skip"));

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          message: "client_id is required",
          data: [],
        },
        { status: 400 },
      );
    }

    const filters = {
      client_id: clientId,
      entity_type: entityType,
      entity_id: entityId,
      category,
      action,
      search,
      date_from: dateFrom,
      date_to: dateTo,
      allowed_visibilities: CLIENT_HISTORY_VISIBILITIES,
    };

    const [activityLogs, total] = await Promise.all([
      findActivityLogs({
        ...filters,
        take,
        skip,
      }),
      countActivityLogs(filters),
    ]);

    const page = Math.floor(skip / take) + 1;
    const totalPages = Math.max(1, Math.ceil(total / take));

    return NextResponse.json(
      {
        success: true,
        data: activityLogs,
        pagination: {
          total,
          take,
          skip,
          page,
          totalPages,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/activity-logs error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load activity logs",
        data: [],
      },
      { status: 500 },
    );
  }
}
