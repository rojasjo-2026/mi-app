import { NextResponse } from "next/server";

import { expireDueInventoryReservations } from "@/lib/inventory/reservations/inventoryReservationExpiration.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

async function readOptionalJsonBody(request: Request) {
  const text = await request.text();

  if (text.trim() === "") {
    return {
      success: true as const,

      value: {},
    };
  }

  try {
    return {
      success: true as const,

      value: JSON.parse(text) as unknown,
    };
  } catch {
    return {
      success: false as const,
    };
  }
}

export async function POST(request: Request) {
  try {
    const parsedBody = await readOptionalJsonBody(request);

    if (!parsedBody.success) {
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

    const result = await expireDueInventoryReservations(parsedBody.value);

    return respond(result);
  } catch (error) {
    console.error("POST /api/inventory/reservations/expire error:", error);

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
