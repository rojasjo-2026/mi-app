import { NextResponse } from "next/server";

import {
  createBusinessWorkingHour,
  deleteBusinessWorkingHour,
  getBusinessWorkingHours,
  updateBusinessWorkingHour,
} from "@/lib/business-working-hours/businessWorkingHours.service";

import { normalizeBusinessWorkingHoursFilters } from "@/lib/business-working-hours/businessWorkingHours.validators";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = normalizeBusinessWorkingHoursFilters(searchParams);

    const result = await getBusinessWorkingHours(filters);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("GET /api/business-working-hours error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createBusinessWorkingHour(body);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("POST /api/business-working-hours error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const result = await updateBusinessWorkingHour(body);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("PUT /api/business-working-hours error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const result = await deleteBusinessWorkingHour(body.id);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("DELETE /api/business-working-hours error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
