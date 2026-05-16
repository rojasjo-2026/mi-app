import { NextResponse } from "next/server";
import {
  getInstallationByIdService,
  updateInstallationByIdService,
  inactivateInstallationByIdService,
} from "@/lib/services/installationService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const installation = await getInstallationByIdService(id);

    if (!installation) {
      return NextResponse.json(
        {
          success: false,
          message: "Installation not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: installation,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/installations/[id] error:", error);

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

    const existingInstallation = await getInstallationByIdService(id);

    if (!existingInstallation) {
      return NextResponse.json(
        {
          success: false,
          message: "Installation not found",
        },
        { status: 404 },
      );
    }

    if (!existingInstallation.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: "Installation is inactive. Reactivate it before updating.",
        },
        { status: 400 },
      );
    }

    const result = await updateInstallationByIdService(id, body);

    if (result === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Installation not found",
        },
        { status: 404 },
      );
    }

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
        data: result.installation,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/installations/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const changedBy =
      typeof body?.changed_by === "string" ? body.changed_by : null;

    const result = await inactivateInstallationByIdService(id, changedBy);

    if (result === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Installation not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Installation inactivated",
        data: result.installation,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/installations/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
