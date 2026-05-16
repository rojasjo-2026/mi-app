import { NextResponse } from "next/server";
import { completeFollowUpStrictService } from "@/lib/services/followUpService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await completeFollowUpStrictService(id);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Follow-up not found",
        },
        { status: 404 },
      );
    }

    if (!result.success && result.code === "completed_status_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Completed status was not found in FollowUpStatus",
        },
        { status: 500 },
      );
    }

    if (!result.success && result.code === "already_completed") {
      return NextResponse.json(
        {
          success: false,
          message: "Follow-up is already completed",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Follow-up completed successfully",
        data: result.followUp,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error completing follow-up:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
