import { NextResponse } from "next/server";

import {
  getContactFlowDateReview,
  reviewContactFlowDate,
} from "@/lib/services/contact-flow/contactFlowDateReviewService";

type RouteContext = {
  params: Promise<{
    contact_flow_id: string;
  }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { contact_flow_id } = await context.params;

    const result = await getContactFlowDateReview(contact_flow_id);

    return NextResponse.json(result.body, {
      status: result.status,
    });
  } catch (error) {
    console.error(
      "GET /api/contact-flows/[contact_flow_id]/date-review error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Ocurrió un error al cargar la revisión de fecha.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { contact_flow_id } = await context.params;
    const body = await req.json().catch(() => null);

    const result = await reviewContactFlowDate({
      contactFlowId: contact_flow_id,
      action: body?.action,
      selectedDate: body?.selected_date,
      reason: body?.reason,
      reviewedBy: body?.reviewed_by,
    });

    return NextResponse.json(result.body, {
      status: result.status,
    });
  } catch (error) {
    console.error(
      "POST /api/contact-flows/[contact_flow_id]/date-review error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Ocurrió un error al procesar la revisión de fecha.",
      },
      {
        status: 500,
      },
    );
  }
}