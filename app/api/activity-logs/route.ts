import { NextResponse } from "next/server";
import type {
  ActivityLogCategory,
  ActivityLogVisibility,
} from "@prisma/client";

import { findActivityLogs } from "@/lib/repositories/activityLogRepository";

const VALID_CATEGORIES = [
  "CLIENT",
  "INSTALLATION",
  "FOLLOW_UP",
  "CONTACT",
  "FILE",
  "FINANCE",
  "SYSTEM",
] as const;

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const clientId = searchParams.get("client_id")?.trim() || undefined;
    const entityType = searchParams.get("entity_type")?.trim() || undefined;
    const entityId = searchParams.get("entity_id")?.trim() || undefined;
    const category = normalizeCategory(searchParams.get("category"));
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

    const activityLogs = await findActivityLogs({
      client_id: clientId,
      entity_type: entityType,
      entity_id: entityId,
      category,
      take,
      skip,

      // El historial vive en Cliente.
      // Por eso el cliente debe poder cargar todos los eventos asociados a su client_id:
      // cliente, instalación, mantenimiento, contacto, archivos, finanzas y sistema.
      //
      // Más adelante, cuando conectemos permisos reales por rol,
      // aquí se puede filtrar según TECHNICIAN, SUPERVISOR, ADMINISTRATION o ADMIN.
      allowed_visibilities: CLIENT_HISTORY_VISIBILITIES,
    });

    return NextResponse.json(
      {
        success: true,
        data: activityLogs,
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
