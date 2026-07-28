import { NextResponse } from "next/server";

import { cancelInventoryDocument } from "@/lib/inventory/lifecycle/inventoryDocumentCancellation.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryDocumentCancellationRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function respond<T>(result: InventoryServiceResult<T>) {
  return NextResponse.json(result.body, {
    status: result.status,
  });
}

async function readRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: InventoryDocumentCancellationRouteContext,
) {
  try {
    const { id } = await params;

    const body = await readRequestBody(request);

    const result = await cancelInventoryDocument(id, body);

    return respond(result);
  } catch (error) {
    console.error("POST /api/inventory/documents/[id]/cancel error:", error);

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
