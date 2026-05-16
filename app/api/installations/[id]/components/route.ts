import { NextResponse } from "next/server";
import {
  getComponentsByInstallationService,
  createComponentService,
} from "@/lib/services/installationComponentService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const components = await getComponentsByInstallationService(id);

    return NextResponse.json(
      {
        success: true,
        data: components,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET components error:", error);

    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const result = await createComponentService(id, body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: result.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.component,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST component error:", error);

    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}
