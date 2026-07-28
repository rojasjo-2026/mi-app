import { NextResponse } from "next/server";

import { getInventoryMovementsFromSearchParams } from "@/lib/inventory/movements/inventoryMovement.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const result = await getInventoryMovementsFromSearchParams(searchParams);

  return respond(result);
}
