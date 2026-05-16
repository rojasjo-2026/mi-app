import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    contact_flow_id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { contact_flow_id } = await context.params;

    const flow = await prisma.maintenanceContactFlow.findUnique({
      where: {
        contact_flow_id,
      },
      select: {
        contact_flow_id: true,
      },
    });

    if (!flow) {
      return NextResponse.json(
        {
          success: false,
          error: "Contact flow not found",
        },
        { status: 404 },
      );
    }

    const messages = await prisma.maintenanceContactMessage.findMany({
      where: {
        contact_flow_id,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: messages,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "GET /api/contact-flows/[contact_flow_id]/messages error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Internal error",
      },
      { status: 500 },
    );
  }
}
