import { NextResponse } from "next/server";

import { cancelInventoryReservation } from "@/lib/inventory/reservations/inventoryReservationCancellation.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type CancellationRouteContext = {
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
  { params }: CancellationRouteContext,
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

    const result = await cancelInventoryReservation(id, requestBody);

    return respond(result);
  } catch (error) {
    console.error("POST /api/inventory/reservations/[id]/cancel error:", error);

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
