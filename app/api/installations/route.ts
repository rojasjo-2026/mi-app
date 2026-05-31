import { NextResponse } from "next/server";
import {
  createInstallationService,
  getInstallationsService,
} from "@/lib/services/installationService";

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.floor(parsedValue);
}

function normalizeSortKey(value: string | null) {
  const allowedSortKeys = [
    "installation",
    "client",
    "service",
    "date",
    "technician",
    "location",
    "amount",
    "status",
  ] as const;

  if (allowedSortKeys.includes(value as (typeof allowedSortKeys)[number])) {
    return value as (typeof allowedSortKeys)[number];
  }

  return "date";
}

function normalizeSortDirection(value: string | null) {
  return value === "asc" ? "asc" : "desc";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await createInstallationService(body);

    if (!result.success && result.errors) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: result.errors,
        },
        { status: 400 },
      );
    }

    if (!result.success && result.code === "client_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found",
        },
        { status: 400 },
      );
    }

    if (!result.success && result.code === "service_type_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Service type not found",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.installation,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/installations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const result = await getInstallationsService({
      search: searchParams.get("search")?.trim() || undefined,
      client_id: searchParams.get("client_id") || undefined,
      status: searchParams.get("status") || undefined,
      zone: searchParams.get("zone") || undefined,
      operational_zone_id: searchParams.get("operational_zone_id") || undefined,
      admin_level_1: searchParams.get("admin_level_1") || undefined,
      admin_level_2: searchParams.get("admin_level_2") || undefined,
      admin_level_3: searchParams.get("admin_level_3") || undefined,
      page: parsePositiveInteger(searchParams.get("page"), 1),
      pageSize: Math.min(
        parsePositiveInteger(searchParams.get("pageSize"), 25),
        100,
      ),
      sortKey: normalizeSortKey(searchParams.get("sortKey")),
      sortDirection: normalizeSortDirection(searchParams.get("sortDirection")),
    });

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        pagination: result.pagination,
        metrics: result.metrics,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/installations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
