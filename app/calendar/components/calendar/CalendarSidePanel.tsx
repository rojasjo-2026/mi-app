"use client";

import type { CalendarEvent } from "@/lib/calendar/calendar-types";

type CalendarAvailabilityDay = {
  date: string;
  can_offer_day: boolean;
  reason: string | null;
  workload: {
    total_jobs: number;
    total_installations: number;
    total_maintenances: number;
    has_installation: boolean;
  };
  capacity: {
    max_jobs_per_day: number | null;
    max_installations_per_day: number | null;
    max_maintenances_per_day: number | null;
    remaining_jobs_capacity: number | null;
    remaining_installations_capacity: number | null;
    remaining_maintenances_capacity: number | null;
  };
};

type Props = {
  sidePanelRef: React.RefObject<HTMLElement | null>;
  selectedDate: Date;
  selectedEvents: CalendarEvent[];
  selectedAvailability?: CalendarAvailabilityDay;
  isLoadingAvailability?: boolean;
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

function getAvailabilityStatusLabel(
  availability?: CalendarAvailabilityDay,
  isBlocked = false,
) {
  if (isBlocked) {
    return "Fecha bloqueada";
  }

  if (!availability) {
    return "Sin cálculo disponible";
  }

  return availability.can_offer_day ? "Disponible" : "No disponible";
}

function getAvailabilityCardClass(
  availability?: CalendarAvailabilityDay,
  isBlocked = false,
) {
  if (isBlocked || availability?.can_offer_day === false) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (availability?.can_offer_day) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function CalendarSidePanel({
  sidePanelRef,
  selectedDate,
  selectedEvents,
  selectedAvailability,
  isLoadingAvailability = false,
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
  const totalJobs = selectedAvailability?.workload.total_jobs ?? 0;
  const totalInstallations =
    selectedAvailability?.workload.total_installations ?? 0;
  const totalMaintenances =
    selectedAvailability?.workload.total_maintenances ?? 0;

  const maxJobs = selectedAvailability?.capacity.max_jobs_per_day ?? null;
  const remainingJobs =
    selectedAvailability?.capacity.remaining_jobs_capacity ?? null;

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

      <div
        className={`mb-5 rounded-2xl border p-4 ${getAvailabilityCardClass(
          selectedAvailability,
          isSelectedDateBlocked,
        )}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
              Disponibilidad del día
            </p>

            <p className="mt-2 text-base font-bold">
              {isLoadingAvailability
                ? "Calculando..."
                : getAvailabilityStatusLabel(
                    selectedAvailability,
                    isSelectedDateBlocked,
                  )}
            </p>
          </div>

          {maxJobs !== null ? (
            <span className="rounded-full border border-current/20 bg-white/60 px-3 py-1 text-xs font-bold">
              {totalJobs}/{maxJobs}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-current/10 bg-white/60 p-3">
            <p className="font-semibold opacity-70">Trabajos</p>
            <p className="mt-1 text-sm font-bold">{totalJobs}</p>
          </div>

          <div className="rounded-xl border border-current/10 bg-white/60 p-3">
            <p className="font-semibold opacity-70">Espacios</p>
            <p className="mt-1 text-sm font-bold">
              {remainingJobs !== null ? remainingJobs : "-"}
            </p>
          </div>

          <div className="rounded-xl border border-current/10 bg-white/60 p-3">
            <p className="font-semibold opacity-70">Instalaciones</p>
            <p className="mt-1 text-sm font-bold">{totalInstallations}</p>
          </div>

          <div className="rounded-xl border border-current/10 bg-white/60 p-3">
            <p className="font-semibold opacity-70">Mantenimientos</p>
            <p className="mt-1 text-sm font-bold">{totalMaintenances}</p>
          </div>
        </div>

        {selectedAvailability?.reason ? (
          <p className="mt-3 text-xs leading-5 opacity-80">
            {selectedAvailability.reason}
          </p>
        ) : null}

        {isSelectedDateBlocked ? (
          <p className="mt-3 text-xs font-semibold opacity-80">
            Esta fecha está bloqueada manualmente en el calendario.
          </p>
        ) : null}
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
