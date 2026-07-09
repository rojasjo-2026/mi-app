import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        is_active: true,
      },
      select: {
        service_type_id: true,
        code: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: serviceTypes,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/service-types error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
