"use client";

import type { Dispatch, SetStateAction } from "react";

type NotesSectionProps = {
  locationNotes: string;
  setLocationNotes: Dispatch<SetStateAction<string>>;
  isListening: boolean;
  startVoiceRecognition: () => void;
  stopVoiceRecognition: () => void;
  addManualNote: () => void;
  clearNotes: () => void;
  maxNotesLength: number;
};

const buttonBase =
  "inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";

export default function NotesSection({
  locationNotes,
  setLocationNotes,
  isListening,
  startVoiceRecognition,
  stopVoiceRecognition,
  addManualNote,
  clearNotes,
  maxNotesLength,
}: NotesSectionProps) {
  const remaining = maxNotesLength - locationNotes.length;
  const hasNotes = locationNotes.trim() !== "";
  const isNearLimit = remaining < 30;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            Notas técnicas
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Registra observaciones del técnico, accesos o condiciones del sitio.
          </p>
        </div>

        <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
          Notas
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={startVoiceRecognition}
          disabled={isListening}
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

        <button type="button" onClick={addManualNote} className={buttonBase}>
          ➕ Nota con fecha
        </button>

        <button
          type="button"
          onClick={clearNotes}
          disabled={!hasNotes}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          🗑 Limpiar
        </button>
      </div>

      <div className="relative">
        <textarea
          value={locationNotes}
          onChange={(e) => {
            if (e.target.value.length <= maxNotesLength) {
              setLocationNotes(e.target.value);
            }
          }}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Ejemplo: acceso complicado, portón cerrado, cliente pidió llamar antes..."
          rows={5}
        />

        <div className="mt-2 flex items-center justify-between text-xs">
          <span
            className={`font-medium ${
              isNearLimit ? "text-red-500" : "text-slate-400"
            }`}
          >
            {remaining} caracteres restantes
          </span>

          <span className="text-slate-400">
            {locationNotes.length}/{maxNotesLength}
          </span>
        </div>
      </div>
    </div>
  );
}
