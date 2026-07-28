import { NextResponse } from "next/server";

import {
  createInventoryDocument,
  getInventoryDocumentsFromSearchParams,
} from "@/lib/inventory/documents/inventoryDocument.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const result = await getInventoryDocumentsFromSearchParams(searchParams);

  return respond(result);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const result = await createInventoryDocument(body);

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

    console.error("POST /api/inventory/documents error:", error);

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
