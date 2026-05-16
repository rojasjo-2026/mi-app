"use client";

import type {
  CalendarEvent,
  ContextMenuState,
} from "@/lib/calendar/calendar-types";

type Props = {
  contextMenu: ContextMenuState;
  onPrepareNote: () => void;
  onStartEditNote: (event: CalendarEvent) => void;
  onDeleteNote: (noteId: string) => void;
  onBlockDate: () => void;
  onUnblockDate: (blockedDateId?: string) => void;
  isSelectedDateBlocked: boolean;
  selectedBlockedDate?: CalendarEvent;
  onClose: () => void;
};

export default function CalendarContextMenu({
  contextMenu,
  onPrepareNote,
  onStartEditNote,
  onDeleteNote,
  onBlockDate,
  onUnblockDate,
  isSelectedDateBlocked,
  selectedBlockedDate,
  onClose,
}: Props) {
  if (!contextMenu) return null;

  const hasEvent = Boolean(contextMenu.event);
  const isNote = contextMenu.event?.type === "note";
  const isBlockedEvent = contextMenu.event?.type === "blocked";

  return (
    <div
      className="fixed z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
      style={{
        top: contextMenu.y,
        left: contextMenu.x,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={onPrepareNote}
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        + Agregar nota
      </button>

      {isSelectedDateBlocked || isBlockedEvent ? (
        <button
          type="button"
          onClick={() =>
            onUnblockDate(contextMenu.event?.id || selectedBlockedDate?.id)
          }
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Desbloquear fecha
        </button>
      ) : (
        <button
          type="button"
          onClick={onBlockDate}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Bloquear fecha
        </button>
      )}

      {hasEvent && !isNote && !isBlockedEvent && (
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver detalle
        </button>
      )}

      {isNote && contextMenu.event && (
        <>
          <button
            type="button"
            onClick={() => onStartEditNote(contextMenu.event!)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Editar nota
          </button>

          <button
            type="button"
            onClick={() => onDeleteNote(contextMenu.event!.id)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Eliminar nota
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-50"
      >
        Cerrar
      </button>
    </div>
  );
}
