import { NextResponse } from "next/server";

import {
  getInventoryDocumentById,
  updateInventoryDocument,
} from "@/lib/inventory/documents/inventoryDocument.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryDocumentRouteContext = {
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
  { params }: InventoryDocumentRouteContext,
) {
  const { id } = await params;

  const result = await getInventoryDocumentById(id);

  return respond(result);
}

export async function PATCH(
  request: Request,
  { params }: InventoryDocumentRouteContext,
) {
  try {
    const { id } = await params;

    const body: unknown = await request.json();

    const result = await updateInventoryDocument(id, body);

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

    console.error("PATCH /api/inventory/documents/[id] error:", error);

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
