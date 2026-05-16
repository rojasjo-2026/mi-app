import { NextResponse } from "next/server";
import { getFollowUpsByZoneService } from "@/lib/services/dashboardService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    const result = await getFollowUpsByZoneService(filter);

    if (!result.success && result.code === "pending_status_not_found") {
      return NextResponse.json(
        {
          success: false,
          message: "Pending status not found",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("GET /api/dashboard/follow-ups-by-zone error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load follow-ups by zone",
        data: [],
      },
      { status: 500 },
    );
  }
}
