import { NextResponse } from "next/server";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";
import {
  createInventoryVariant,
  getInventoryVariantsFromSearchParams,
} from "@/lib/inventory/variants/inventoryVariant.service";

type ProductVariantsRouteContext = {
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
  request: Request,
  { params }: ProductVariantsRouteContext,
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  searchParams.set("product_id", id);

  const result = await getInventoryVariantsFromSearchParams(searchParams);

  return respond(result);
}

export async function POST(
  request: Request,
  { params }: ProductVariantsRouteContext,
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();

    const result = await createInventoryVariant(id, body);

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

    console.error("POST /api/inventory/products/[id]/variants error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ocurrió un error interno.",
      },
      { status: 500 },
    );
  }
}
