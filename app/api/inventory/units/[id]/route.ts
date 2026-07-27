import { NextResponse } from "next/server";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";
import {
  deactivateUnitOfMeasure,
  getUnitOfMeasureById,
  updateUnitOfMeasure,
} from "@/lib/inventory/units/unitOfMeasure.service";

type UnitRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

export async function GET(_request: Request, { params }: UnitRouteContext) {
  const { id } = await params;
  const result = await getUnitOfMeasureById(id);

  return respond(result);
}

export async function PATCH(request: Request, { params }: UnitRouteContext) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const result = await updateUnitOfMeasure(id, body);

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

    console.error("PATCH /api/inventory/units/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ocurrió un error interno.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: UnitRouteContext) {
  const { id } = await params;
  const result = await deactivateUnitOfMeasure(id);

  return respond(result);
}
