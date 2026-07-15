"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";

type Note = {
  follow_up_note_id: string;
  note_text: string;
  created_at: string;
};

type FollowUpNotesSectionProps = {
  followUpId: string;
};

type SpeechRecognitionAlternativeResult = {
  transcript?: string;
};

type SpeechRecognitionResultItem = {
  0?: SpeechRecognitionAlternativeResult;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultItem;
};

type BrowserSpeechRecognitionEvent = {
  results: SpeechRecognitionResultListLike;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type WindowWithSpeechRecognition = Window &
  typeof globalThis & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

const buttonBase =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

const maxNotesLength = 300;

function getSafeLocale(locale?: string | null) {
  const normalizedLocale = locale?.trim();

  return normalizedLocale || "es";
}

function formatDateTime(value: string | null, locale = "es") {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  try {
    return date.toLocaleString(getSafeLocale(locale));
  } catch {
    return date.toLocaleString("es");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNote(value: unknown): value is Note {
  return (
    isRecord(value) &&
    typeof value.follow_up_note_id === "string" &&
    typeof value.note_text === "string" &&
    typeof value.created_at === "string"
  );
}

function getErrorMessage(data: unknown, fallback: string) {
  if (isRecord(data) && typeof data.message === "string") {
    return data.message;
  }

  return fallback;
}

function normalizeNotesPayload(data: unknown) {
  if (Array.isArray(data)) {
    return data.filter(isNote);
  }

  if (isRecord(data) && Array.isArray(data.data)) {
    return data.data.filter(isNote);
  }

  return [];
}

function normalizeCreatedNotePayload(data: unknown) {
  if (isNote(data)) {
    return data;
  }

  if (isRecord(data) && isNote(data.data)) {
    return data.data;
  }

  return null;
}

function getSpeechRecognitionApi() {
  if (typeof window === "undefined") {
    return null;
  }

  const browserWindow = window as WindowWithSpeechRecognition;

  return (
    browserWindow.SpeechRecognition ||
    browserWindow.webkitSpeechRecognition ||
    null
  );
}

function getTranscriptFromRecognitionEvent(
  event: BrowserSpeechRecognitionEvent,
) {
  const transcriptParts: string[] = [];

  for (let index = 0; index < event.results.length; index += 1) {
    const transcript = event.results[index]?.[0]?.transcript;

    if (transcript) {
      transcriptParts.push(transcript);
    }
  }

  return transcriptParts.join(" ").trim();
}

export default function FollowUpNotesSection({
  followUpId,
}: FollowUpNotesSectionProps) {
  const { businessCountryMeta } = useAppSettings();
  const locale = businessCountryMeta.locale || "es";

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "info">(
    "info",
  );

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  const remaining = maxNotesLength - newNote.length;

  const noteCountLabel = useMemo(() => {
    if (notes.length === 1) return "1 nota";
    return `${notes.length} notas`;
  }, [notes.length]);

  function showStatus(
    message: string,
    type: "success" | "error" | "info" = "info",
  ) {
    setStatusMessage(message);
    setStatusType(type);
  }

  function clearStatus() {
    setStatusMessage("");
  }

  async function parseResponse(res: Response): Promise<unknown> {
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

    return JSON.parse(raw) as unknown;
  }

  async function loadNotes(showLoadingMessage = false) {
    try {
      setLoadingNotes(true);

      if (showLoadingMessage) {
        showStatus("Actualizando notas...", "info");
      }

      const res = await fetch(`/api/follow-ups/${followUpId}/notes`, {
        cache: "no-store",
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        throw new Error(
          getErrorMessage(data, "No se pudieron cargar las notas"),
        );
      }

      setNotes(normalizeNotesPayload(data));

      if (showLoadingMessage) {
        showStatus("Notas actualizadas.", "success");
      }
    } catch (error) {
      console.error("Error al cargar notas del mantenimiento:", error);
      showStatus("No se pudieron cargar las notas.", "error");
    } finally {
      setLoadingNotes(false);
    }
  }

  useEffect(() => {
    if (!followUpId) return;

    void loadNotes();
  }, [followUpId]);

  useEffect(() => {
    if (!statusMessage) return;

    const timeout = window.setTimeout(() => {
      setStatusMessage("");
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  async function handleAddNote() {
    if (!newNote.trim()) return;

    try {
      setLoading(true);
      clearStatus();

      const res = await fetch(`/api/follow-ups/${followUpId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: newNote }),
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        throw new Error(getErrorMessage(data, "No se pudo guardar la nota"));
      }

      const createdNote = normalizeCreatedNotePayload(data);

      if (!createdNote) {
        throw new Error(
          "La nota fue guardada, pero la respuesta no es válida.",
        );
      }

      setNotes((prev) => [createdNote, ...prev]);
      setNewNote("");
      showStatus("Nota guardada correctamente.", "success");
    } catch (error) {
      console.error("Error al guardar nota del mantenimiento:", error);

      const message =
        error instanceof Error ? error.message : "Error al guardar la nota";

      showStatus(message, "error");
    } finally {
      setLoading(false);
    }
  }

  function addManualNote() {
    const now = formatDateTime(new Date().toISOString(), locale);
    const stampedText = `${newNote ? `${newNote}\n` : ""}[${now}] `;

    if (stampedText.length <= maxNotesLength) {
      setNewNote(stampedText);
      showStatus("Se agregó una marca de fecha a la nota.", "info");
    }
  }

  function clearNotes() {
    setNewNote("");
    clearStatus();
  }

  function startVoiceRecognition() {
    if (loading) return;

    const SpeechRecognitionApi = getSpeechRecognitionApi();

    if (!SpeechRecognitionApi) {
      showStatus(
        "El dictado por voz no está disponible en este navegador.",
        "error",
      );
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionApi();

    recognition.lang = "es";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
      showStatus("Micrófono activo. Empezá a dictar.", "info");
    };

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      const transcript = getTranscriptFromRecognitionEvent(event);

      if (!transcript) return;

      setNewNote((prev) => {
        const merged = prev ? `${prev} ${transcript}` : transcript;
        return merged.slice(0, maxNotesLength);
      });
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
      showStatus("Hubo un problema al usar el micrófono.", "error");
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopVoiceRecognition() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);
    showStatus("Micrófono detenido.", "info");
  }

  function getStatusClasses() {
    if (statusType === "success") {
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (statusType === "error") {
      return "border border-red-200 bg-red-50 text-red-700";
    }

    return "border border-slate-200 bg-slate-50 text-slate-700";
  }

  return (
    <div className="space-y-4">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-950">
              Notas del mantenimiento
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Registra observaciones, acuerdos con el cliente y detalles
              importantes para futuras visitas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-600">
              {noteCountLabel}
            </span>

            <button
              type="button"
              onClick={() => void loadNotes(true)}
              disabled={loadingNotes}
              className={buttonBase}
            >
              {loadingNotes ? "Actualizando..." : "↻ Recargar"}
            </button>
          </div>
        </div>

        {statusMessage ? (
          <div
            className={`rounded-md px-3 py-2.5 text-sm font-medium ${getStatusClasses()}`}
          >
            {statusMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startVoiceRecognition}
            disabled={loading || isListening}
            className={`${buttonBase} ${
              isListening ? "border-red-300 bg-red-50 text-red-700" : ""
            }`}
          >
            {isListening ? "🎤 Escuchando..." : "🎤 Dictar"}
          </button>

          <button
            type="button"
            onClick={stopVoiceRecognition}
            disabled={!isListening}
            className={buttonBase}
          >
            ⏹ Detener
          </button>

          <button
            type="button"
            onClick={addManualNote}
            disabled={loading}
            className={buttonBase}
          >
            ➕ Nota con fecha
          </button>

          <button
            type="button"
            onClick={clearNotes}
            disabled={loading}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            🗑 Limpiar
          </button>
        </div>

        <div>
          <textarea
            value={newNote}
            onChange={(e) => {
              if (e.target.value.length <= maxNotesLength) {
                setNewNote(e.target.value);
              }
            }}
            className="min-h-24 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-5 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            placeholder="Ej: cliente no estaba, reagendar para viernes..."
            rows={4}
          />

          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span
              className={`font-medium ${
                remaining < 30 ? "text-red-500" : "text-slate-500"
              }`}
            >
              {remaining} caracteres restantes
            </span>

            <span className="text-slate-500">
              {newNote.length}/{maxNotesLength}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleAddNote()}
            disabled={loading || !newNote.trim()}
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar nota"}
          </button>
        </div>
      </section>

      <section>
        {loadingNotes ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Cargando notas...
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Sin notas registradas.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            {notes.map((note, index) => (
              <article
                key={note.follow_up_note_id}
                className={[
                  "px-3 py-3",
                  index < notes.length - 1 ? "border-b border-slate-200" : "",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {index === 0 ? "Más reciente" : "Historial"}
                  </span>

                  <span className="text-xs font-medium text-slate-500">
                    {formatDateTime(note.created_at, locale)}
                  </span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-800">
                  {note.note_text}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
