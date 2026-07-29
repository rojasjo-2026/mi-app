import { NextResponse } from "next/server";

import { consumeInventoryReservation } from "@/lib/inventory/reservations/inventoryReservationConsumption.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryReservationConsumptionRouteContext = {
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
  request: Request,
  { params }: InventoryReservationConsumptionRouteContext,
) {
  try {
    const { id } = await params;

    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,

          message: "El cuerpo de la solicitud no contiene JSON válido.",

          errors: {
            body: "Envíe un objeto JSON válido.",
          },
        },
        {
          status: 400,
        },
      );
    }

    const result = await consumeInventoryReservation(id, requestBody);

    return respond(result);
  } catch (error) {
    console.error(
      "POST /api/inventory/reservations/[id]/consume error:",
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
