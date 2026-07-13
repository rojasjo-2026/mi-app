"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import NotesSection from "@/components/installations/NotesSection";
import { resolveAppSettings } from "@/lib/config/app-settings";

type Note = {
  technical_note_id: string;
  note_text: string;
  created_at: string;
};

type Props = {
  installationId: string;
};

type SpeechRecognitionAlternativeLike = {
  transcript?: string;
};

type SpeechRecognitionResultLike = {
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionResultEventLike = {
  results?: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type BrowserWindowWithSpeech = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

const MAX_WORK_NOTES_LENGTH = 1000;
const NOTES_PER_PAGE = 8;

function formatNoteDate(value: string, locale: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(locale);
}

export default function TechnicalNotes({ installationId }: Props) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const locale = useMemo(() => resolveAppSettings().locale, []);

  const noteCountLabel = useMemo(() => {
    if (notes.length === 1) return "1 nota de trabajo";
    return `${notes.length} notas de trabajo`;
  }, [notes.length]);

  const latestNote = notes[0] ?? null;

  const totalPages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));

  const paginatedNotes = useMemo(() => {
    const startIndex = (currentPage - 1) * NOTES_PER_PAGE;
    const endIndex = startIndex + NOTES_PER_PAGE;

    return notes.slice(startIndex, endIndex);
  }, [currentPage, notes]);

  const firstVisibleNote =
    notes.length === 0 ? 0 : (currentPage - 1) * NOTES_PER_PAGE + 1;

  const lastVisibleNote = Math.min(currentPage * NOTES_PER_PAGE, notes.length);

  async function parseResponse(res: Response) {
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (!contentType.includes("application/json")) {
      throw new Error(
        `El endpoint devolvió una respuesta no válida (${res.status}). ${raw.slice(
          0,
          200,
        )}`,
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
          data.message || "No se pudieron cargar las notas de trabajo",
        );
      }

      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar notas de trabajo:", error);
    }
  }

  useEffect(() => {
    void loadNotes();
  }, [installationId]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!isHistoryOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsHistoryOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHistoryOpen]);

  function addTimestampedText(text: string) {
    const timestamp = new Date().toLocaleString(locale);
    const newEntry = `[${timestamp}] ${text}`.trim();

    setNewNote((current) => {
      const nextValue = current ? `${current}\n${newEntry}` : newEntry;
      return nextValue.slice(0, MAX_WORK_NOTES_LENGTH);
    });
  }

  function startVoiceRecognition() {
    const browserWindow = window as BrowserWindowWithSpeech;
    const SpeechRecognition =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("El navegador no soporta reconocimiento de voz");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      const text = event.results?.[0]?.[0]?.transcript || "";

      if (text.trim()) {
        addTimestampedText(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const speechError = event?.error || "unknown";

      setIsListening(false);

      if (speechError === "no-speech") {
        return;
      }

      if (speechError === "aborted") {
        return;
      }

      if (speechError === "not-allowed") {
        alert("Debe permitir el uso del micrófono para dictar notas.");
        return;
      }

      console.warn("Error de voz:", speechError);
      alert("No se pudo capturar la nota por voz");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }

  function stopVoiceRecognition() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  function addManualNote() {
    addTimestampedText("Nueva nota");
  }

  function clearDraftNote() {
    setNewNote("");
  }

  function openHistory() {
    setCurrentPage(1);
    setIsHistoryOpen(true);
  }

  function closeHistory() {
    setIsHistoryOpen(false);
  }

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(1, page - 1));
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  }

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
        throw new Error(
          data.message || "No se pudo guardar la nota de trabajo",
        );
      }

      setNotes((prev) => [data, ...prev]);
      setNewNote("");
    } catch (error) {
      console.error("Error al guardar nota de trabajo:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Error al guardar la nota de trabajo";

      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="h-full">
        <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-slate-950">
                  Notas de trabajo
                </h2>
                <p className="text-xs leading-5 text-slate-500">
                  Registra observaciones del técnico, seguimiento y detalles
                  importantes del trabajo.
                </p>
              </div>

              <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                {noteCountLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col space-y-4 px-4 py-4">
            <NotesSection
              locationNotes={newNote}
              setLocationNotes={setNewNote}
              isListening={isListening}
              startVoiceRecognition={startVoiceRecognition}
              stopVoiceRecognition={stopVoiceRecognition}
              addManualNote={addManualNote}
              clearNotes={clearDraftNote}
              maxNotesLength={MAX_WORK_NOTES_LENGTH}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500">
                Al agregar la nota, se guardará en el historial y el campo
                quedará listo para una nueva entrada.
              </p>

              <button
                type="button"
                onClick={handleAddNote}
                disabled={loading || !newNote.trim()}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Agregar nota"}
              </button>
            </div>

            <div className="mt-auto border-t border-slate-100 pt-4">
              {latestNote ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Última nota
                      </span>

                      <span className="text-xs font-medium text-slate-400">
                        {formatNoteDate(latestNote.created_at, locale)}
                      </span>
                    </div>

                    <p
                      className="mt-2 max-h-16 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-slate-700"
                      title={latestNote.note_text}
                    >
                      {latestNote.note_text}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openHistory}
                    className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Ver historial
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Sin notas de trabajo registradas.
                  </p>

                  <span className="text-xs text-slate-400">
                    Las nuevas notas aparecerán aquí.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isHistoryOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              closeHistory();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="technical-notes-history-title"
            className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="technical-notes-history-title"
                  className="text-base font-semibold text-slate-950"
                >
                  Historial de notas de trabajo
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Consulta todas las observaciones registradas para esta
                  instalación.
                </p>
              </div>

              <button
                type="button"
                onClick={closeHistory}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3">
              <span className="text-sm font-medium text-slate-600">
                {noteCountLabel}
              </span>

              <span className="text-xs text-slate-500">
                Mostrando {firstVisibleNote}-{lastVisibleNote} de {notes.length}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6">
              <div className="divide-y divide-slate-100">
                {paginatedNotes.map((note, index) => {
                  const absoluteIndex =
                    (currentPage - 1) * NOTES_PER_PAGE + index;

                  return (
                    <article
                      key={note.technical_note_id}
                      className="py-5 first:pt-5"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {absoluteIndex === 0
                            ? "Más reciente"
                            : "Historial de trabajo"}
                        </span>

                        <span className="text-xs font-medium text-slate-400">
                          {formatNoteDate(note.created_at, locale)}
                        </span>
                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {note.note_text}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Página {currentPage} de {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
