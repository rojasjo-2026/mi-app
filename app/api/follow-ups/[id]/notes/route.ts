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

    const notes = await prisma.followUpNote.findMany({
      where: {
        follow_up_id: id,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error("GET follow up notes error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load notes",
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

    const newNote = await prisma.followUpNote.create({
      data: {
        follow_up_id: id,
        note_text: note,
      },
    });

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    console.error("POST follow up note error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create note",
      },
      { status: 500 },
    );
  }
}
