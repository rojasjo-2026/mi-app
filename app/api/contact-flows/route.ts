import { NextResponse } from "next/server";

import {
  createContactFlow,
  getContactFlows,
  normalizeFilter,
  normalizePositiveInteger,
  normalizeSortDirection,
  normalizeSortKey,
} from "@/lib/services/contactFlows/contactFlowService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const followUpId = searchParams.get("follow_up_id")?.trim() || null;
    const page = normalizePositiveInteger(searchParams.get("page"), 1);
    const pageSize = Math.min(
      100,
      normalizePositiveInteger(searchParams.get("pageSize"), 15),
    );
    const filter = normalizeFilter(searchParams.get("filter"));
    const sortKey = normalizeSortKey(searchParams.get("sortKey"));
    const sortDirection = normalizeSortDirection(
      searchParams.get("sortDirection"),
    );

    const result = await getContactFlows({
      followUpId,
      page,
      pageSize,
      filter,
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
    console.error("GET /api/contact-flows error:", error);

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
    const body = await req.json().catch(() => null);

    const followUpId =
      typeof body?.follow_up_id === "string" ? body.follow_up_id.trim() : "";

    if (!followUpId) {
      return NextResponse.json(
        {
          success: false,
          message: "El mantenimiento es requerido.",
        },
        { status: 400 },
      );
    }

    const result = await createContactFlow(followUpId);

    if ("error" in result) {
      return NextResponse.json(
        {
          success: false,
          message: result.error,
        },
        { status: result.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: result.message,
      },
      { status: result.status },
    );
  } catch (error) {
    console.error("POST /api/contact-flows error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
