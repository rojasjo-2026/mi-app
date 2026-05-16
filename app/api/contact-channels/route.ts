import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const channels = await prisma.contactChannel.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error("GET /api/contact-channels error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load contact channels",
        data: null,
      },
      { status: 500 },
    );
  }
}
