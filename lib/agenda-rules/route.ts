import { NextResponse } from "next/server";

import {
  createAgendaRule,
  deleteAgendaRule,
  getAgendaRules,
  updateAgendaRule,
} from "@/lib/agenda-rules/agendaRules.service";

import { normalizeAgendaRulesFilters } from "@/lib/agenda-rules/agendaRules.validators";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = normalizeAgendaRulesFilters(searchParams);

    const result = await getAgendaRules(filters);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("GET /api/agenda-rules error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createAgendaRule(body);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("POST /api/agenda-rules error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const result = await updateAgendaRule(body);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("PUT /api/agenda-rules error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const result = await deleteAgendaRule(body.id);

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("DELETE /api/agenda-rules error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
