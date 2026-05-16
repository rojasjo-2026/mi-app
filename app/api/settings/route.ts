import { NextResponse } from "next/server";

import {
  getOrCreateAppSettingsService,
  updateAppSettingsService,
} from "@/lib/services/settingsService";

export async function GET() {
  try {
    const settings = await getOrCreateAppSettingsService();

    return NextResponse.json(
      {
        success: true,
        data: settings,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/settings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load settings",
        data: null,
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const settings = await updateAppSettingsService(body);

    return NextResponse.json(
      {
        success: true,
        data: settings,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/settings error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update settings",
        data: null,
      },
      { status: 500 },
    );
  }
}
