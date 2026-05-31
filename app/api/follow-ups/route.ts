import { NextResponse } from "next/server";
import {
  createFollowUpService,
  getFollowUpsService,
} from "@/lib/services/followUpService";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await createFollowUpService(body);

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
        { status: 404 },
      );
    }

    if (!result.success && result.code === "installation_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Installation not found",
        },
        { status: 404 },
      );
    }

    if (!result.success && result.code === "installation_client_mismatch") {
      return NextResponse.json(
        {
          success: false,
          message: "Installation does not belong to the selected client",
        },
        { status: 409 },
      );
    }

    if (!result.success && result.code === "pending_status_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Default follow-up status not found",
        },
        { status: 500 },
      );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not create follow-up",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.followUp,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/follow-ups error:", error);

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

    const result = await getFollowUpsService({
      client_id: searchParams.get("client_id") || undefined,
      installation_id: searchParams.get("installation_id") || undefined,
      operational_zone_id: searchParams.get("operational_zone_id") || undefined,
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      search: searchParams.get("search")?.trim() || undefined,
      timing: searchParams.get("timing") || undefined,
      billingStatus: searchParams.get("billingStatus") || undefined,
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      sortKey: (searchParams.get("sortKey") || undefined) as Parameters<
        typeof getFollowUpsService
      >[0]["sortKey"],
      sortDirection:
        searchParams.get("sortDirection") === "desc" ? "desc" : "asc",
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
    console.error("GET /api/follow-ups error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
