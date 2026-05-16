"use client";

import { useEffect, useMemo, useState } from "react";

type Note = {
  technical_note_id: string;
  note_text: string;
  created_at: string;
};

type Props = {
  installationId: string;
};

export default function TechnicalNotes({ installationId }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

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

      setNotes(data);
    } catch (error) {
      console.error("Error al cargar observaciones:", error);
    }
  }

  useEffect(() => {
    loadNotes();
  }, [installationId]);

  async function handleAddNote() {
    if (!newNote.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/installations/${installationId}/technical-notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ note: newNote }),
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
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Nueva observación
            </p>
            <p className="text-xs text-slate-500">
              Registra detalles técnicos importantes de esta instalación.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {noteCountLabel}
          </span>
        </div>

        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          placeholder="Agregar observación técnica..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Las observaciones más recientes se muestran primero.
          </p>

          <button
            type="button"
            onClick={handleAddNote}
            disabled={loading || !newNote.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Agregar observación"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm text-slate-500">
            Sin observaciones registradas.
          </div>
        ) : (
          notes.map((n, index) => (
            <div
              key={n.technical_note_id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  {index === 0 ? "Más reciente" : "Historial técnico"}
                </span>

                <span className="text-xs font-medium text-slate-400">
                  {new Date(n.created_at).toLocaleString("es-CR")}
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
                {n.note_text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
