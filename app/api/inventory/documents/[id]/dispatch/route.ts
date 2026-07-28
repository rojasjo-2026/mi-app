import { NextResponse } from "next/server";

import { dispatchInventoryTransfer } from "@/lib/inventory/transfers/inventoryTransferDispatch.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryTransferDispatchRouteContext = {
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
  _request: Request,
  { params }: InventoryTransferDispatchRouteContext,
) {
  try {
    const { id } = await params;

    const result = await dispatchInventoryTransfer(id);

    return respond(result);
  } catch (error) {
    console.error("POST /api/inventory/documents/[id]/dispatch error:", error);

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
