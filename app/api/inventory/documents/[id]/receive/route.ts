import { NextResponse } from "next/server";

import { receiveInventoryTransfer } from "@/lib/inventory/transfers/inventoryTransferReceive.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryTransferReceiveRouteContext = {
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
  { params }: InventoryTransferReceiveRouteContext,
) {
  try {
    const { id } = await params;

    const result = await receiveInventoryTransfer(id);

    return respond(result);
  } catch (error) {
    console.error("POST /api/inventory/documents/[id]/receive error:", error);

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
