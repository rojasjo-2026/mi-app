import { NextResponse } from "next/server";

import {
  deactivateInventoryCode,
  getInventoryCodeById,
  updateInventoryCode,
} from "@/lib/inventory/codes/inventoryCode.service";
import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryCodeRouteContext = {
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
  { params }: InventoryCodeRouteContext,
) {
  const { id } = await params;

  const result = await getInventoryCodeById(id);

  return respond(result);
}

export async function PATCH(
  request: Request,
  { params }: InventoryCodeRouteContext,
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();

    const result = await updateInventoryCode(id, body);

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

    console.error("PATCH /api/inventory/codes/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ocurrió un error interno.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: InventoryCodeRouteContext,
) {
  const { id } = await params;

  const result = await deactivateInventoryCode(id);

  return respond(result);
}
