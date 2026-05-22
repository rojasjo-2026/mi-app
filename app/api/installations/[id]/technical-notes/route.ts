import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const notes = await prisma.technicalNote.findMany({
      where: {
        installation_id: id,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error("GET technical notes error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load technical notes",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const note = String(body?.note || "").trim();

    if (!note) {
      return NextResponse.json(
        {
          success: false,
          message: "Note is required",
        },
        { status: 400 },
      );
    }

    const installation = await prisma.installation.findUnique({
      where: {
        installation_id: id,
      },
      select: {
        installation_id: true,
        client_id: true,
      },
    });

    if (!installation) {
      return NextResponse.json(
        {
          success: false,
          message: "Installation not found",
        },
        { status: 404 },
      );
    }

    const newNote = await prisma.$transaction(async (tx) => {
      const createdNote = await tx.technicalNote.create({
        data: {
          installation_id: id,
          note_text: note,
        },
      });

      await tx.activityLog.create({
        data: {
          client_id: installation.client_id,
          entity_type: "INSTALLATION",
          entity_id: installation.installation_id,
          category: "INSTALLATION",
          action: "NOTE_ADDED",
          visibility: "PUBLIC_INTERNAL",
          field_name: "technical_note",
          old_value: null,
          new_value: note,
          title: "Observación técnica agregada",
          description: "Se agregó una observación técnica a la instalación.",
          created_by: "system",
        },
      });

      return createdNote;
    });

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error("POST technical note error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create technical note",
      },
      { status: 500 },
    );
  }
}
