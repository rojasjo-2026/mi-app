import { NextResponse } from "next/server";
import { postponeFollowUpByIdService } from "@/lib/services/followUpService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const result = await postponeFollowUpByIdService(id, body);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Follow up not found",
          data: null,
        },
        { status: 404 },
      );
    }

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

    if (!result.success && result.code === "postponed_status_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Postponed status not found",
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
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH /api/follow-ups/[id]/postpone error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to postpone follow up",
        data: null,
      },
      { status: 500 },
    );
  }
}
