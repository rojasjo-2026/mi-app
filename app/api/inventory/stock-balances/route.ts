import { NextResponse } from "next/server";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";
import { getInventoryStockBalancesFromSearchParams } from "@/lib/inventory/stock/inventoryStockBalance.service";

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const result = await getInventoryStockBalancesFromSearchParams(searchParams);

  return respond(result);
}
