import { NextResponse } from "next/server";

import { getInventoryMovementById } from "@/lib/inventory/movements/inventoryMovement.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryMovementRouteContext = {
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
  { params }: InventoryMovementRouteContext,
) {
  const { id } = await params;

  const result = await getInventoryMovementById(id);

  return respond(result);
}
