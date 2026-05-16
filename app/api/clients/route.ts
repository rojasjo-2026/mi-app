import { NextResponse } from "next/server";
import {
  getClientsService,
  createClientService,
} from "@/lib/services/clientService";
import { normalizeClientStatusFilter } from "@/lib/clients/clientStatus";
import { getFriendlyPrismaDuplicateError } from "@/lib/utils/prismaError.utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || undefined;
    const status = normalizeClientStatusFilter(searchParams.get("status"));

    const clients = await getClientsService({ search, status });

    return NextResponse.json(
      {
        success: true,
        data: clients,
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
