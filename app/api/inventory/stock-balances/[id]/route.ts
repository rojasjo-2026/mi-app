import { NextResponse } from "next/server";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";
import { getInventoryStockBalanceById } from "@/lib/inventory/stock/inventoryStockBalance.service";

type InventoryStockBalanceRouteContext = {
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
  { params }: InventoryStockBalanceRouteContext,
) {
  const { id } = await params;

  const result = await getInventoryStockBalanceById(id);

  return respond(result);
}
