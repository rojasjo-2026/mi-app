import { NextResponse } from "next/server";

import {
  createInventoryCode,
  getInventoryCodesFromSearchParams,
} from "@/lib/inventory/codes/inventoryCode.service";
import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type VariantCodesRouteContext = {
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
  { params }: VariantCodesRouteContext,
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  searchParams.set("variant_id", id);

  const result = await getInventoryCodesFromSearchParams(searchParams);

  return respond(result);
}

export async function POST(
  request: Request,
  { params }: VariantCodesRouteContext,
) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();

    const result = await createInventoryCode(id, body);

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

    console.error("POST /api/inventory/variants/[id]/codes error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Ocurrió un error interno.",
      },
      { status: 500 },
    );
  }
}
