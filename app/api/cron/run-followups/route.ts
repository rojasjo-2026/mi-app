import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/jobs/run-followups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      source: "/api/cron/run-followups",
      jobResult: result,
    });
  } catch (error) {
    console.error("GET /api/cron/run-followups error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to trigger follow-up job.",
      },
      { status: 500 },
    );
  }
}
