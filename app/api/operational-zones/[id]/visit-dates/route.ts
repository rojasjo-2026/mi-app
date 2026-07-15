import { NextResponse } from "next/server";

import {
  createOperationalZoneVisitDate,
  getOperationalZoneVisitDatesFromSearchParams,
} from "@/lib/operational-zones/operationalZoneVisitDates.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    const result = await getOperationalZoneVisitDatesFromSearchParams(
      id,
      searchParams,
    );

    return NextResponse.json(result.body, {
      status: result.status,
    });
  } catch (error) {
    console.error("GET /api/operational-zones/[id]/visit-dates error:", error);

    return NextResponse.json(
      {
        success: false,
        data: [],
        message: "No se pudieron cargar las fechas de visita.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const result = await createOperationalZoneVisitDate(id, body);

    return NextResponse.json(result.body, {
      status: result.status,
    });
  } catch (error) {
    console.error("POST /api/operational-zones/[id]/visit-dates error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo crear la fecha de visita.",
      },
      {
        status: 500,
      },
    );
  }
}
