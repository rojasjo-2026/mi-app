import { NextResponse } from "next/server";

import { getInventoryReservationManagementDetail } from "@/lib/inventory/reservations/inventoryReservationQuery.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryReservationDetailRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

export async function GET(
  _request: Request,
  { params }: InventoryReservationDetailRouteContext,
) {
  try {
    const { id } = await params;

    const result = await getInventoryReservationManagementDetail(id);

    return respond(result);
  } catch (error) {
    console.error("GET /api/inventory/reservations/[id] error:", error);

    return NextResponse.json(
      {
        success: false,

        message: "Ocurrio un error interno.",
      },
      {
        status: 500,
      },
    );
  }
}
