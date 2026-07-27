import { NextResponse } from "next/server";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";
import {
  deactivateInventoryCategory,
  getInventoryCategoryById,
  updateInventoryCategory,
} from "@/lib/inventory/categories/inventoryCategory.service";

type InventoryCategoryRouteContext = {
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
  { params }: InventoryCategoryRouteContext,
) {
  const { id } = await params;
  const result = await getInventoryCategoryById(id);

  return respond(result);
}

export async function PATCH(
  request: Request,
  { params }: InventoryCategoryRouteContext,
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();

    const result = await updateInventoryCategory(id, body);

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

    console.error("PATCH /api/inventory/categories/[id] error:", error);

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
  { params }: InventoryCategoryRouteContext,
) {
  const { id } = await params;
  const result = await deactivateInventoryCategory(id);

  return respond(result);
}
