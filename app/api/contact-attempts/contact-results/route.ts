import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results = await prisma.contactResult.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("GET /api/contact-results error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load contact results",
        data: null,
      },
      { status: 500 },
    );
  }
}
