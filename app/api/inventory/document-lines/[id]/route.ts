import { NextResponse } from "next/server";

import {
  deleteInventoryDocumentLine,
  getInventoryDocumentLineById,
  updateInventoryDocumentLine,
} from "@/lib/inventory/document-lines/inventoryDocumentLine.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryDocumentLineRouteContext = {
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
  { params }: InventoryDocumentLineRouteContext,
) {
  const { id } = await params;

  const result = await getInventoryDocumentLineById(id);

  return respond(result);
}

export async function PATCH(
  request: Request,
  { params }: InventoryDocumentLineRouteContext,
) {
  try {
    const { id } = await params;

    const body: unknown = await request.json();

    const result = await updateInventoryDocumentLine(id, body);

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

    console.error("PATCH /api/inventory/document-lines/[id] error:", error);

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

export async function DELETE(
  _request: Request,
  { params }: InventoryDocumentLineRouteContext,
) {
  const { id } = await params;

  const result = await deleteInventoryDocumentLine(id);

  return respond(result);
}
