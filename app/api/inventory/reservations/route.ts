import { NextResponse } from "next/server";

import { createInventoryReservation } from "@/lib/inventory/reservations/inventoryReservation.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const result = await createInventoryReservation(body);

    return respond(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message: "El cuerpo JSON de la solicitud no es válido.",
        },
        {
          status: 400,
        },
      );
    }

    console.error("POST /api/inventory/reservations error:", error);

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
