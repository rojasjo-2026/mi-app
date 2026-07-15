import { NextResponse } from "next/server";

import { getOperationalZoneVisitDateSuggestions } from "@/lib/operational-zones/operationalZoneVisitDateSuggestions.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const result = await getOperationalZoneVisitDateSuggestions(id);

    return NextResponse.json(result.body, {
      status: result.status,
    });
  } catch (error) {
    console.error(
      "GET /api/operational-zones/[id]/visit-date-suggestions error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        data: [],
        message:
          "No se pudieron consultar las fechas sugeridas para la zona operativa.",
      },
      {
        status: 500,
      },
    );
  }
}
