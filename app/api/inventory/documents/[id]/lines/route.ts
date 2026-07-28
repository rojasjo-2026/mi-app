import { NextResponse } from "next/server";

import { createInventoryDocumentLine } from "@/lib/inventory/document-lines/inventoryDocumentLine.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryDocumentLinesRouteContext = {
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
  { params }: InventoryDocumentLinesRouteContext,
) {
  try {
    const { id } = await params;

    const body: unknown = await request.json();

    const result = await createInventoryDocumentLine(id, body);

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

    console.error("POST /api/inventory/documents/[id]/lines error:", error);

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
