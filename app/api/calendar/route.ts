import { NextResponse } from "next/server";
import { getCalendarEventsService } from "@/lib/services/calendarService";

export async function GET() {
  try {
    const events = await getCalendarEventsService();

    return NextResponse.json(
      {
        success: true,
        data: events,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/calendar error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
