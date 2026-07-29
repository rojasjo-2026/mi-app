import { NextResponse } from "next/server";

import { releaseInventoryReservation } from "@/lib/inventory/reservations/inventoryReservationRelease.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryReservationReleaseRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

async function readRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: InventoryReservationReleaseRouteContext,
) {
  try {
    const { id } = await params;

    const body = await readRequestBody(request);

    const result = await releaseInventoryReservation(id, body);

    return respond(result);
  } catch (error) {
    console.error(
      "POST /api/inventory/reservations/[id]/release error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Ocurrió un error interno.",
      },
      {
        status: 500,
      },
    );
  }
}
