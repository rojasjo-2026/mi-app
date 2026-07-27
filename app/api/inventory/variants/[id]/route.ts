import { NextResponse } from "next/server";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";
import {
  deactivateInventoryVariant,
  getInventoryVariantById,
  updateInventoryVariant,
} from "@/lib/inventory/variants/inventoryVariant.service";

type InventoryVariantRouteContext = {
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
  { params }: InventoryVariantRouteContext,
) {
  const { id } = await params;

  const result = await getInventoryVariantById(id);

  return respond(result);
}

export async function PATCH(
  request: Request,
  { params }: InventoryVariantRouteContext,
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();

    const result = await updateInventoryVariant(id, body);

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

    console.error("PATCH /api/inventory/variants/[id] error:", error);

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
  { params }: InventoryVariantRouteContext,
) {
  const { id } = await params;

  const result = await deactivateInventoryVariant(id);

  return respond(result);
}
