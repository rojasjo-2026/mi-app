import { NextResponse } from "next/server";
import {
  updateComponentService,
  deleteComponentService,
} from "@/lib/services/installationComponentService";

type RouteContext = {
  params: Promise<{ componentId: string }>;
};

export async function PUT(req: Request, context: RouteContext) {
  try {
    const { componentId } = await context.params;
    const body = await req.json();

    const result = await updateComponentService(componentId, body);

    if (result === null) {
      return NextResponse.json(
        { success: false, message: "Component not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.component,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT component error:", error);

    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { componentId } = await context.params;

    const result = await deleteComponentService(componentId);

    if (result === null) {
      return NextResponse.json(
        { success: false, message: "Component not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Component deleted",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE component error:", error);

    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}
