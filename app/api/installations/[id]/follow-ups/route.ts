import { NextResponse } from "next/server";
import { createFollowUpFromInstallationService } from "@/lib/services/followUpService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const result = await createFollowUpFromInstallationService(id, body);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Installation not found",
          data: null,
        },
        { status: 404 },
      );
    }

    if (!result.success && "errors" in result) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: result.errors,
        },
        { status: 400 },
      );
    }

    if (!result.success && result.code === "pending_status_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Pending status not found",
          data: null,
        },
        { status: 500 },
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
    console.error("POST follow-up error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create follow up",
        data: null,
      },
      { status: 500 },
    );
  }
}
