import { NextResponse } from "next/server";
import {
  getFollowUpByIdService,
  completeFollowUpByIdService,
  updateFollowUpByIdService,
} from "@/lib/services/followUpService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const followUp = await getFollowUpByIdService(id);

    if (!followUp) {
      return NextResponse.json(
        {
          success: false,
          message: "Follow up not found",
          data: null,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    console.error("GET /api/follow-ups/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load follow up",
        data: null,
      },
      { status: 500 },
    );
  }
}

export async function PUT(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await completeFollowUpByIdService(id);

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

    if (!result.success && result.code === "completed_status_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Completed status not found",
          data: null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.followUp,
    });
  } catch (error) {
    console.error("PUT /api/follow-ups/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update follow up",
        data: null,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const result = await updateFollowUpByIdService(id, body);

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

    if (!result.success && result.errors?.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: result.errors,
          data: null,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.followUp,
    });
  } catch (error) {
    console.error("PATCH /api/follow-ups/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to patch follow up",
        data: null,
      },
      { status: 500 },
    );
  }
}
