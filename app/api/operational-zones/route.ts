import { NextResponse } from "next/server";

import {
  activateOperationalZoneById,
  createOperationalZone,
  deactivateOperationalZoneById,
  deleteOperationalZoneById,
  getOperationalZonesFromSearchParams,
  updateOperationalZone,
} from "@/lib/operational-zones/operationalZones.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await getOperationalZonesFromSearchParams(searchParams);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("GET /api/operational-zones error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudieron cargar las zonas operativas.",
        data: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createOperationalZone(body);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("POST /api/operational-zones error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo crear la zona operativa.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const result = await updateOperationalZone(body);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("PUT /api/operational-zones error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo actualizar la zona operativa.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = body.operational_zone_id || body.id;
    const action = String(body.action || "")
      .trim()
      .toLowerCase();

    const result =
      action === "activate"
        ? await activateOperationalZoneById(id)
        : await deactivateOperationalZoneById(id);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("PATCH /api/operational-zones error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo cambiar el estado de la zona operativa.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = body.operational_zone_id || body.id;

    const result = await deleteOperationalZoneById(id);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("DELETE /api/operational-zones error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo desactivar la zona operativa.",
      },
      { status: 500 },
    );
  }
}
