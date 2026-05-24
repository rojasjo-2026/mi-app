import { NextResponse } from "next/server";
import {
  createInstallationService,
  getInstallationsService,
} from "@/lib/services/installationService";

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

    const params = {
      search: searchParams.get("search")?.trim() || undefined,
      client_id: searchParams.get("client_id") || undefined,
      status: searchParams.get("status") || undefined,
      zone: searchParams.get("zone") || undefined,
      operational_zone_id: searchParams.get("operational_zone_id") || undefined,
      admin_level_1: searchParams.get("admin_level_1") || undefined,
      admin_level_2: searchParams.get("admin_level_2") || undefined,
      admin_level_3: searchParams.get("admin_level_3") || undefined,
    };

    const installations = await getInstallationsService(params);

    return NextResponse.json(
      {
        success: true,
        data: installations,
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
