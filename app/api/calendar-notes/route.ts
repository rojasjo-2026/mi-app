import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapNote(note: {
  calendar_note_id: string;
  note_date: Date;
  title: string;
  note_text: string | null;
}) {
  return {
    id: note.calendar_note_id,
    date: formatDate(note.note_date),
    type: "note",
    title: note.title,
    description: note.note_text || "",
  };
}

export async function GET() {
  try {
    const notes = await prisma.calendarNote.findMany({
      orderBy: { note_date: "asc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: notes.map(mapNote),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/calendar-notes error:", error);

    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const noteDate = parseDateOnly(body.note_date);
    const noteText = String(body.note_text || "").trim();

    if (!noteDate) {
      return NextResponse.json(
        { success: false, message: "Invalid note date" },
        { status: 400 },
      );
    }

    if (!noteText) {
      return NextResponse.json(
        { success: false, message: "Note text is required" },
        { status: 400 },
      );
    }

    const note = await prisma.calendarNote.create({
      data: {
        note_date: noteDate,
        title: "Nota",
        note_text: noteText,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: mapNote(note),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/calendar-notes error:", error);

    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const noteId = String(body.id || "").trim();
    const noteText = String(body.note_text || "").trim();

    if (!noteId) {
      return NextResponse.json(
        { success: false, message: "Note id is required" },
        { status: 400 },
      );
    }

    if (!noteText) {
      return NextResponse.json(
        { success: false, message: "Note text is required" },
        { status: 400 },
      );
    }

    const note = await prisma.calendarNote.update({
      where: {
        calendar_note_id: noteId,
      },
      data: {
        note_text: noteText,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: mapNote(note),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/calendar-notes error:", error);

    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    const noteId = String(body.id || "").trim();

    if (!noteId) {
      return NextResponse.json(
        { success: false, message: "Note id is required" },
        { status: 400 },
      );
    }

    await prisma.calendarNote.delete({
      where: {
        calendar_note_id: noteId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: noteId,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/calendar-notes error:", error);

    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}
