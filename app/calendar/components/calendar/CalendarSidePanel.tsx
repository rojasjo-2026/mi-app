"use client";

import type { CalendarEvent } from "@/lib/calendar/calendar-types";

type Props = {
  sidePanelRef: React.RefObject<HTMLElement | null>;
  selectedDate: Date;
  selectedEvents: CalendarEvent[];
  noteText: string;
  noteError: string;
  isSavingNote: boolean;
  noteTextAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  onNoteTextChange: (value: string) => void;
  onSaveNote: () => void;
  onCreateMaintenance: () => void;
  onBlockDate: () => void;
  isSelectedDateBlocked: boolean;
  isUpdatingBlockedDate: boolean;
  renderEventCard: (event: CalendarEvent) => React.ReactNode;
};

export default function CalendarSidePanel({
  sidePanelRef,
  selectedDate,
  selectedEvents,
  noteText,
  noteError,
  isSavingNote,
  noteTextAreaRef,
  onNoteTextChange,
  onSaveNote,
  onCreateMaintenance,
  onBlockDate,
  isSelectedDateBlocked,
  isUpdatingBlockedDate,
  renderEventCard,
}: Props) {
  return (
    <aside
      ref={sidePanelRef}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-5">
        <p className="text-sm text-slate-500">Día seleccionado</p>
        <h2 className="text-xl font-bold capitalize">
          {selectedDate.toLocaleDateString("es-CR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h2>
      </div>

      <div className="mb-6 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Eventos del día
        </h3>

        {selectedEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No hay eventos registrados para este día.
          </div>
        ) : (
          selectedEvents.map((event) => renderEventCard(event))
        )}
      </div>

      <div className="mb-4 rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
        <label className="mb-2 block text-sm font-semibold text-purple-900">
          Nota del día
        </label>

        <textarea
          ref={noteTextAreaRef}
          value={noteText}
          onChange={(event) => onNoteTextChange(event.target.value)}
          rows={4}
          placeholder="Escribí una nota para esta fecha..."
          className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-purple-400"
        />

        {noteError ? (
          <p className="mt-2 text-sm font-medium text-red-600">{noteError}</p>
        ) : null}

        <button
          type="button"
          onClick={onSaveNote}
          disabled={isSavingNote}
          className="mt-3 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-purple-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSavingNote ? "Guardando nota..." : "Guardar nota"}
        </button>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onSaveNote}
          disabled={isSavingNote}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSavingNote ? "Guardando..." : "+ Agregar nota"}
        </button>

        <button
          type="button"
          onClick={onCreateMaintenance}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"
        >
          + Crear mantenimiento
        </button>

        <button
          type="button"
          onClick={onBlockDate}
          disabled={isUpdatingBlockedDate}
          className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${
            isSelectedDateBlocked
              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {isUpdatingBlockedDate
            ? "Procesando..."
            : isSelectedDateBlocked
              ? "Desbloquear fecha"
              : "Bloquear fecha"}
        </button>
      </div>
    </aside>
  );
}
