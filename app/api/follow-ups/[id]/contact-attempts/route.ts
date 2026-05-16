import { NextResponse } from "next/server";
import {
  createContactAttemptService,
  getContactAttemptsByFollowUpIdService,
} from "@/lib/services/contactAttemptService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const result = await createContactAttemptService(id, body);

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

    if (!result.success && result.code === "follow_up_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Follow-up not found",
        },
        { status: 404 },
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

    if (!result.success && result.code === "contact_channel_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Contact channel not found",
        },
        { status: 404 },
      );
    }

    if (!result.success && result.code === "contact_result_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Contact result not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.contactAttempt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/follow-ups/[id]/contact-attempts error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const attempts = await getContactAttemptsByFollowUpIdService(id);

    if (attempts === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Follow-up not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: attempts,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/follow-ups/[id]/contact-attempts error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
