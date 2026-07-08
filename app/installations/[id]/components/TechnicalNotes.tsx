"use client";

import { useEffect, useMemo, useState } from "react";

import { resolveAppSettings } from "@/lib/config/app-settings";

type Note = {
  technical_note_id: string;
  note_text: string;
  created_at: string;
};

type Props = {
  installationId: string;
};

function formatNoteDate(value: string, locale: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(locale);
}

export default function TechnicalNotes({ installationId }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  const locale = useMemo(() => resolveAppSettings().locale, []);

  const noteCountLabel = useMemo(() => {
    if (notes.length === 1) return "1 observación";
    return `${notes.length} observaciones`;
  }, [notes.length]);

  async function parseResponse(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (!contentType.includes("application/json")) {
      throw new Error(
        `El endpoint devolvió una respuesta no válida (${res.status}). ${raw.slice(0, 200)}`,
      );
    }

    return JSON.parse(raw);
  }

  async function loadNotes() {
    try {
      const res = await fetch(
        `/api/installations/${installationId}/technical-notes`,
        { cache: "no-store" },
      );

      const data = await parseResponse(res);

      if (!res.ok) {
        throw new Error(
          data.message || "No se pudieron cargar las observaciones",
        );
      }

      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar observaciones:", error);
    }
  }

  useEffect(() => {
    void loadNotes();
  }, [installationId]);

  async function handleAddNote() {
    const noteText = newNote.trim();

    if (!noteText) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/installations/${installationId}/technical-notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ note: noteText }),
        },
      );

      const data = await parseResponse(res);

      if (!res.ok) {
        throw new Error(data.message || "No se pudo guardar la observación");
      }

      setNotes((prev) => [data, ...prev]);
      setNewNote("");
    } catch (error) {
      console.error("Error al guardar observación:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Error al guardar la observación";

      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-950">
                Observaciones técnicas
              </h2>
              <p className="text-xs leading-5 text-slate-500">
                Registra detalles técnicos importantes de esta instalación.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
              {noteCountLabel}
            </span>
          </div>
        </div>

        <div className="space-y-3 px-4 py-4">
          <textarea
            className="min-h-[96px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            placeholder="Agregar observación técnica..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Las observaciones más recientes se muestran primero.
            </p>

            <button
              type="button"
              onClick={handleAddNote}
              disabled={loading || !newNote.trim()}
              className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Agregar observación"}
            </button>
          </div>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
          Sin observaciones registradas.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {notes.map((note, index) => (
            <article
              key={note.technical_note_id}
              className="border-t border-slate-100 px-4 py-4 first:border-t-0"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {index === 0 ? "Más reciente" : "Historial técnico"}
                </span>

                <span className="text-xs font-medium text-slate-400">
                  {formatNoteDate(note.created_at, locale)}
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {note.note_text}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
