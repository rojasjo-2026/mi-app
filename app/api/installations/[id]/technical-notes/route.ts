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

    const note = body?.note?.trim();

    if (!note) {
      return NextResponse.json(
        {
          success: false,
          message: "Note is required",
        },
        { status: 400 },
      );
    }

    const newNote = await prisma.technicalNote.create({
      data: {
        installation_id: id,
        note_text: note,
      },
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
