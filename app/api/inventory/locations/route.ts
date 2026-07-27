import { NextResponse } from "next/server";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";
import {
  createInventoryLocation,
  getInventoryLocationsFromSearchParams,
} from "@/lib/inventory/locations/inventoryLocation.service";

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const result = await getInventoryLocationsFromSearchParams(searchParams);

  return respond(result);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = await createInventoryLocation(body);

    return respond(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message: "El cuerpo JSON de la solicitud no es válido.",
        },
        { status: 400 },
      );
    }

    console.error("POST /api/inventory/locations error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ocurrió un error interno.",
      },
      { status: 500 },
    );
  }
}
