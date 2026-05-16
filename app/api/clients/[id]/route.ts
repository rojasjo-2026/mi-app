import { NextResponse } from "next/server";
import {
  getClientByIdService,
  updateClientByIdService,
  inactivateClientByIdService,
} from "@/lib/services/clientService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const client = await getClientByIdService(id);

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: client,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/clients/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const result = await updateClientByIdService(id, body);

    if (result === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.client,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/clients/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await inactivateClientByIdService(id);

    if (result === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Client inactivated",
        data: result.client,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/clients/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
