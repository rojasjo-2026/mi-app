import { NextResponse } from "next/server";
import {
  getClientsService,
  createClientService,
} from "@/lib/services/clientService";
import { normalizeClientStatusFilter } from "@/lib/clients/clientStatus";
import { getFriendlyPrismaDuplicateError } from "@/lib/utils/prismaError.utils";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function getNumberParam(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getPageSize(value: string | null) {
  return Math.min(getNumberParam(value, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
}

function getCountryCodeParam(value: string | null) {
  const countryCode = String(value || "")
    .trim()
    .toUpperCase();

  return countryCode || undefined;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || undefined;
    const status = normalizeClientStatusFilter(searchParams.get("status"));
    const whatsapp = searchParams.get("whatsapp") || "all";
    const countryCode = getCountryCodeParam(searchParams.get("country_code"));

    const page = getNumberParam(searchParams.get("page"), DEFAULT_PAGE);
    const pageSize = getPageSize(searchParams.get("pageSize"));

    const sortKey = searchParams.get("sortKey") || "client";
    const sortDirection =
      searchParams.get("sortDirection") === "desc" ? "desc" : "asc";

    const result = await getClientsService({
      search,
      status,
      whatsapp,
      countryCode,
      page,
      pageSize,
      sortKey,
      sortDirection,
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
    console.error("GET /api/clients error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await createClientService(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: result.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Client created",
        data: result.client,
      },
      { status: 201 },
    );
  } catch (error) {
    const duplicateError = getFriendlyPrismaDuplicateError(error, "Client");

    if (duplicateError) {
      return NextResponse.json(
        {
          success: false,
          message: duplicateError.message,
          errors: duplicateError.errors,
        },
        { status: duplicateError.status },
      );
    }

    console.error("POST /api/clients error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
