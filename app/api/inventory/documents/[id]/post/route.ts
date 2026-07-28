import { NextResponse } from "next/server";

import { postInventoryDocument } from "@/lib/inventory/posting/inventoryDocumentPosting.service";

import type { InventoryServiceResult } from "@/lib/inventory/shared/inventoryServiceResult.types";

type InventoryDocumentPostingRouteContext = {
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
  { params }: InventoryDocumentPostingRouteContext,
) {
  try {
    const { id } = await params;

    const result = await postInventoryDocument(id);

    return respond(result);
  } catch (error) {
    console.error("POST /api/inventory/documents/[id]/post error:", error);

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
