"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import CalendarHeader from "@/app/calendar/components/calendar/CalendarHeader";
import CalendarStats from "@/app/calendar/components/calendar/CalendarStats";
import CalendarMonthView from "@/app/calendar/components/calendar/CalendarMonthView";
import CalendarWeekView from "@/app/calendar/components/calendar/CalendarWeekView";
import CalendarDayView from "@/app/calendar/components/calendar/CalendarDayView";
import CalendarSidePanel from "@/app/calendar/components/calendar/CalendarSidePanel";
import CalendarContextMenu from "@/app/calendar/components/calendar/CalendarContextMenu";

import type {
  CalendarEvent,
  CalendarViewMode,
  ContextMenuState,
} from "@/lib/calendar/calendar-types";

import {
  formatDateKey,
  getCalendarDays,
  getEventLabel,
  getEventStyle,
  getStartOfWeek,
  getWeekDates,
  monthNames,
} from "@/lib/calendar/calendar-utils";

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

type AvailabilityRangeResponse = {
  success: boolean;
  data?:
    | CalendarAvailabilityDay
    | {
        results?: CalendarAvailabilityDay[];
      };
  message?: string;
};

function getInclusiveDayCount(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(
    Math.round((end.getTime() - start.getTime()) / millisecondsPerDay) + 1,
    1,
  );
}

function mapAvailabilityByDate(items: CalendarAvailabilityDay[]) {
  return items.reduce<Record<string, CalendarAvailabilityDay>>((acc, item) => {
    acc[item.date] = item;
    return acc;
  }, {});
}

function isAvailabilityRangeData(
  data: AvailabilityRangeResponse["data"],
): data is { results?: CalendarAvailabilityDay[] } {
  return Boolean(data && "results" in data);
}

function isAvailabilityDayData(
  data: AvailabilityRangeResponse["data"],
): data is CalendarAvailabilityDay {
  return Boolean(
    data && "date" in data && "workload" in data && "capacity" in data,
  );
}

export default function CalendarPage() {
  const today = new Date();
  const todayKey = formatDateKey(today);

  const sidePanelRef = useRef<HTMLElement | null>(null);
  const noteTextAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const [calendarView, setCalendarView] = useState<CalendarViewMode>("month");
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<CalendarEvent[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteError, setNoteError] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [availabilityByDate, setAvailabilityByDate] = useState<
    Record<string, CalendarAvailabilityDay>
  >({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [isUpdatingBlockedDate, setIsUpdatingBlockedDate] = useState(false);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  async function loadCalendarEvents() {
    try {
      setIsLoadingEvents(true);

      const [
        calendarResponse,
        notesResponse,
        blockedResponse,
        nonWorkingDaysResponse,
      ] = await Promise.all([
        fetch("/api/calendar", { cache: "no-store" }),
        fetch("/api/calendar-notes", { cache: "no-store" }),
        fetch("/api/calendar-blocked", { cache: "no-store" }),
        fetch("/api/calendar-non-working-days?active_only=true", {
          cache: "no-store",
        }),
      ]);

      const calendarResult = await calendarResponse.json();
      const notesResult = await notesResponse.json();
      const blockedResult = await blockedResponse.json();
      const nonWorkingDaysResult = await nonWorkingDaysResponse.json();

      const calendarEvents =
        calendarResult.success && Array.isArray(calendarResult.data)
          ? calendarResult.data
          : [];

      const blockedEvents =
        blockedResult.success && Array.isArray(blockedResult.data)
          ? blockedResult.data
          : [];

      const nonWorkingDayEvents =
        nonWorkingDaysResult.success && Array.isArray(nonWorkingDaysResult.data)
          ? nonWorkingDaysResult.data
          : [];

      setEvents([...calendarEvents, ...blockedEvents, ...nonWorkingDayEvents]);

      setNotes(
        notesResult.success && Array.isArray(notesResult.data)
          ? notesResult.data
          : [],
      );
    } catch (error) {
      console.error("Error loading calendar events:", error);
      setEvents([]);
      setNotes([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }

  async function loadAvailabilityForVisibleMonth(monthDate: Date) {
    const startDate = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1,
    );

    const endDate = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
    );

    const startDateKey = formatDateKey(startDate);
    const days = getInclusiveDayCount(startDate, endDate);

    try {
      setIsLoadingAvailability(true);

      const response = await fetch(
        `/api/availability/daily?country_code=CR&date=${startDateKey}&days=${days}`,
        { cache: "no-store" },
      );

      const result: AvailabilityRangeResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "No se pudo cargar la disponibilidad.",
        );
      }

      let availabilityItems: CalendarAvailabilityDay[] = [];

      if (isAvailabilityRangeData(result.data)) {
        availabilityItems = Array.isArray(result.data.results)
          ? result.data.results
          : [];
      } else if (isAvailabilityDayData(result.data)) {
        availabilityItems = [result.data];
      }

      setAvailabilityByDate(mapAvailabilityByDate(availabilityItems));
    } catch (error) {
      console.error("Error loading calendar availability:", error);
      setAvailabilityByDate({});
    } finally {
      setIsLoadingAvailability(false);
    }
  }

  useEffect(() => {
    void loadCalendarEvents();
  }, []);

  useEffect(() => {
    void loadAvailabilityForVisibleMonth(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null);

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu);

    return () => {
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu);
    };
  }, []);

  const allEvents = useMemo(() => [...events, ...notes], [events, notes]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month],
  );

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const selectedDateKey = formatDateKey(selectedDate);

  const selectedEvents = allEvents.filter(
    (event) => event.date === selectedDateKey,
  );

  const selectedBlockedDate = selectedEvents.find(
    (event) => event.type === "blocked",
  );

  const isSelectedDateBlocked = Boolean(selectedBlockedDate);

  const todayEventsCount = allEvents.filter(
    (event) => event.date === todayKey,
  ).length;

  const overdueEventsCount = allEvents.filter(
    (event) => event.type === "overdue",
  ).length;

  const upcomingEventsCount = allEvents.filter(
    (event) => event.type === "upcoming",
  ).length;

  const installationEventsCount = allEvents.filter(
    (event) => event.type === "installation",
  ).length;

  const handleRightClick = (event: React.MouseEvent, date: Date) => {
    event.preventDefault();
    event.stopPropagation();

    setSelectedDate(date);
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      date,
    });
  };

  const goToPreviousMonth = () => {
    if (calendarView === "month") {
      setCurrentMonth(new Date(year, month - 1, 1));
      return;
    }

    if (calendarView === "week") {
      const previousWeek = new Date(selectedDate);
      previousWeek.setDate(selectedDate.getDate() - 7);
      setSelectedDate(previousWeek);
      setCurrentMonth(
        new Date(previousWeek.getFullYear(), previousWeek.getMonth(), 1),
      );
      return;
    }

    const previousDay = new Date(selectedDate);
    previousDay.setDate(selectedDate.getDate() - 1);
    setSelectedDate(previousDay);
    setCurrentMonth(
      new Date(previousDay.getFullYear(), previousDay.getMonth(), 1),
    );
  };

  const goToNextMonth = () => {
    if (calendarView === "month") {
      setCurrentMonth(new Date(year, month + 1, 1));
      return;
    }

    if (calendarView === "week") {
      const nextWeek = new Date(selectedDate);
      nextWeek.setDate(selectedDate.getDate() + 7);
      setSelectedDate(nextWeek);
      setCurrentMonth(new Date(nextWeek.getFullYear(), nextWeek.getMonth(), 1));
      return;
    }

    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    setSelectedDate(nextDay);
    setCurrentMonth(new Date(nextDay.getFullYear(), nextDay.getMonth(), 1));
  };

  const goToToday = () => {
    const currentToday = new Date();

    setCurrentMonth(
      new Date(currentToday.getFullYear(), currentToday.getMonth(), 1),
    );

    setSelectedDate(currentToday);
    setNoteError("");
    setEditingNoteId(null);
    setEditingNoteText("");
    setContextMenu(null);

    setTimeout(() => {
      sidePanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 50);
  };

  const handleSelectDate = (day: Date) => {
    setSelectedDate(day);
    setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
    setNoteError("");
    setEditingNoteId(null);
    setEditingNoteText("");
    setContextMenu(null);

    setTimeout(() => {
      sidePanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 50);
  };

  const handlePrepareNoteFromContext = () => {
    if (!contextMenu) return;

    handleSelectDate(contextMenu.date);
    setContextMenu(null);

    setTimeout(() => {
      noteTextAreaRef.current?.focus();
    }, 80);
  };

  const handleSaveNote = async () => {
    const cleanNote = noteText.trim();

    setNoteError("");

    if (!cleanNote) {
      setNoteError("Debes escribir una nota antes de guardarla.");
      return;
    }

    setIsSavingNote(true);

    try {
      const response = await fetch("/api/calendar-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note_date: selectedDateKey,
          note_text: cleanNote,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo guardar la nota.");
      }

      setNoteText("");
      await loadCalendarEvents();
    } catch (error) {
      setNoteError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar la nota.",
      );
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleBlockDate = async () => {
    if (isSelectedDateBlocked) return;

    const shouldBlock = window.confirm(
      "¿Seguro que deseas bloquear esta fecha?",
    );

    if (!shouldBlock) return;

    setIsUpdatingBlockedDate(true);
    setNoteError("");

    try {
      const response = await fetch("/api/calendar-blocked", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blocked_date: selectedDateKey,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo bloquear la fecha.");
      }

      await loadCalendarEvents();
    } catch (error) {
      console.error("Error blocking date:", error);
      setNoteError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al bloquear la fecha.",
      );
    } finally {
      setIsUpdatingBlockedDate(false);
    }
  };

  const handleUnblockDate = async (blockedDateId?: string) => {
    const idToDelete = blockedDateId || selectedBlockedDate?.id;

    if (!idToDelete) {
      setNoteError("No se encontró la fecha bloqueada.");
      return;
    }

    const shouldUnblock = window.confirm(
      "¿Seguro que deseas desbloquear esta fecha?",
    );

    if (!shouldUnblock) return;

    setIsUpdatingBlockedDate(true);
    setNoteError("");
    setContextMenu(null);

    try {
      const response = await fetch("/api/calendar-blocked", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: idToDelete,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo desbloquear la fecha.");
      }

      await loadCalendarEvents();
    } catch (error) {
      console.error("Error unblocking date:", error);
      setNoteError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al desbloquear la fecha.",
      );
    } finally {
      setIsUpdatingBlockedDate(false);
    }
  };

  const handleToggleBlockedDate = () => {
    if (isSelectedDateBlocked) {
      handleUnblockDate(selectedBlockedDate?.id);
      return;
    }

    handleBlockDate();
  };

  const handleStartEditNote = (event: CalendarEvent) => {
    setEditingNoteId(event.id);
    setEditingNoteText(event.description || "");
    setNoteError("");
    setContextMenu(null);
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteText("");
    setNoteError("");
  };

  const handleUpdateNote = async () => {
    const cleanNote = editingNoteText.trim();

    setNoteError("");

    if (!editingNoteId) {
      setNoteError("No se encontró la nota seleccionada.");
      return;
    }

    if (!cleanNote) {
      setNoteError("La nota no puede quedar vacía.");
      return;
    }

    setIsUpdatingNote(true);

    try {
      const response = await fetch("/api/calendar-notes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingNoteId,
          note_text: cleanNote,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo actualizar la nota.");
      }

      setEditingNoteId(null);
      setEditingNoteText("");
      await loadCalendarEvents();
    } catch (error) {
      setNoteError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al actualizar la nota.",
      );
    } finally {
      setIsUpdatingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const shouldDelete = window.confirm(
      "¿Seguro que deseas eliminar esta nota?",
    );

    if (!shouldDelete) return;

    setNoteError("");
    setIsDeletingNote(true);
    setContextMenu(null);

    try {
      const response = await fetch("/api/calendar-notes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: noteId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo eliminar la nota.");
      }

      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setEditingNoteText("");
      }

      await loadCalendarEvents();
    } catch (error) {
      setNoteError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al eliminar la nota.",
      );
    } finally {
      setIsDeletingNote(false);
    }
  };

  const handleGoToNewFollowUp = () => {
    window.location.href = "/follow-ups/new";
  };

  const renderEventCard = (event: CalendarEvent) => {
    const isEditingThisNote = editingNoteId === event.id;

    return (
      <div
        key={event.id}
        className="rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getEventStyle(
              event.type,
            )}`}
          >
            {getEventLabel(event.type)}
          </span>

          {event.type === "note" && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartEditNote(event)}
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => handleDeleteNote(event.id)}
                disabled={isDeletingNote}
                className="text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Eliminar
              </button>
            </div>
          )}

          {event.type === "blocked" && (
            <button
              type="button"
              onClick={() => handleUnblockDate(event.id)}
              disabled={isUpdatingBlockedDate}
              className="text-xs font-semibold text-slate-600 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Desbloquear
            </button>
          )}
        </div>

        {isEditingThisNote ? (
          <div className="space-y-2">
            <textarea
              value={editingNoteText}
              onChange={(event) => setEditingNoteText(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUpdateNote}
                disabled={isUpdatingNote}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingNote ? "Guardando..." : "Guardar"}
              </button>

              <button
                type="button"
                onClick={handleCancelEditNote}
                disabled={isUpdatingNote}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-semibold text-slate-900">{event.title}</p>

            {event.description && (
              <p className="mt-1 text-sm text-slate-500">{event.description}</p>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <CalendarHeader
        calendarView={calendarView}
        onChangeView={setCalendarView}
        onToday={goToToday}
        onCreateMaintenance={handleGoToNewFollowUp}
        isLoadingEvents={isLoadingEvents || isLoadingAvailability}
      />

      <CalendarStats
        todayEventsCount={todayEventsCount}
        overdueEventsCount={overdueEventsCount}
        upcomingEventsCount={upcomingEventsCount}
        installationEventsCount={installationEventsCount}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
            >
              ← Anterior
            </button>

            <h2 className="text-xl font-bold">
              {calendarView === "month"
                ? `${monthNames[month]} ${year}`
                : calendarView === "week"
                  ? `Semana de ${getStartOfWeek(
                      selectedDate,
                    ).toLocaleDateString("es-CR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : selectedDate.toLocaleDateString("es-CR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
            </h2>

            <button
              type="button"
              onClick={goToNextMonth}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
            >
              Siguiente →
            </button>
          </div>

          {calendarView === "month" && (
            <CalendarMonthView
              calendarDays={calendarDays}
              allEvents={allEvents}
              today={today}
              selectedDate={selectedDate}
              availabilityByDate={availabilityByDate}
              isLoadingAvailability={isLoadingAvailability}
              onSelectDate={handleSelectDate}
              onRightClick={handleRightClick}
            />
          )}

          {calendarView === "week" && (
            <CalendarWeekView
              weekDates={weekDates}
              allEvents={allEvents}
              today={today}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onRightClick={handleRightClick}
            />
          )}

          {calendarView === "day" && (
            <CalendarDayView
              selectedDate={selectedDate}
              selectedEvents={selectedEvents}
              renderEventCard={renderEventCard}
            />
          )}
        </section>

        <CalendarSidePanel
          sidePanelRef={sidePanelRef}
          selectedDate={selectedDate}
          selectedEvents={selectedEvents}
          selectedAvailability={availabilityByDate[selectedDateKey]}
          isLoadingAvailability={isLoadingAvailability}
          noteText={noteText}
          noteError={noteError}
          isSavingNote={isSavingNote}
          noteTextAreaRef={noteTextAreaRef}
          onNoteTextChange={setNoteText}
          onSaveNote={handleSaveNote}
          onCreateMaintenance={handleGoToNewFollowUp}
          onBlockDate={handleToggleBlockedDate}
          isSelectedDateBlocked={isSelectedDateBlocked}
          isUpdatingBlockedDate={isUpdatingBlockedDate}
          renderEventCard={renderEventCard}
        />
      </div>

      <CalendarContextMenu
        contextMenu={contextMenu}
        onPrepareNote={handlePrepareNoteFromContext}
        onStartEditNote={handleStartEditNote}
        onDeleteNote={handleDeleteNote}
        onBlockDate={handleBlockDate}
        onUnblockDate={handleUnblockDate}
        isSelectedDateBlocked={isSelectedDateBlocked}
        selectedBlockedDate={selectedBlockedDate}
        onClose={() => setContextMenu(null)}
      />
    </main>
  );
}
