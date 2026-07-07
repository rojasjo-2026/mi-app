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

const secondaryButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={startVoiceRecognition}
          disabled={isListening}
          className={`${secondaryButtonClassName} ${
            isListening ? "border-red-200 bg-red-50 text-red-700" : ""
          }`}
        >
          {isListening ? "🎤 Escuchando..." : "🎤 Dictar"}
        </button>

        <button
          type="button"
          onClick={stopVoiceRecognition}
          disabled={!isListening}
          className={secondaryButtonClassName}
        >
          ⏹ Detener
        </button>

        <button
          type="button"
          onClick={addManualNote}
          className={secondaryButtonClassName}
        >
          ➕ Nota con fecha
        </button>

        <button
          type="button"
          onClick={clearNotes}
          disabled={!hasNotes}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          🗑 Limpiar
        </button>
      </div>

      <div>
        <textarea
          value={locationNotes}
          onChange={(e) => {
            if (e.target.value.length <= maxNotesLength) {
              setLocationNotes(e.target.value);
            }
          }}
          className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          placeholder="Ejemplo: acceso complicado, portón cerrado, cliente pidió llamar antes..."
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
