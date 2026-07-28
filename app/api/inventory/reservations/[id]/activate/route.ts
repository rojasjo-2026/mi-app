import { NextResponse } from "next/server";

import { activateInventoryReservation } from "@/lib/inventory/reservations/inventoryReservationActivation.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryReservationActivationRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

export async function POST(
  _request: Request,
  { params }: InventoryReservationActivationRouteContext,
) {
  try {
    const { id } = await params;

    const result = await activateInventoryReservation(id);

    return respond(result);
  } catch (error) {
    console.error(
      "POST /api/inventory/reservations/[id]/activate error:",
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
