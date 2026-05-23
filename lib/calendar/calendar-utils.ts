import type { CalendarEventType } from "@/lib/calendar/calendar-types";

export const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isSameDate(a: Date, b: Date) {
  return formatDateKey(a) === formatDateKey(b);
}

export function getCalendarDays(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstWeekDay = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDays = lastDayOfMonth.getDate();

  const days: Array<Date | null> = [];

  for (let i = 0; i < firstWeekDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

export function getStartOfWeek(date: Date) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;

  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);

  return start;
}

export function getWeekDates(date: Date) {
  const start = getStartOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function getEventStyle(type: CalendarEventType) {
  if (type === "overdue") return "bg-red-100 text-red-700 border-red-200";

  if (type === "today") {
    return "bg-yellow-200 text-yellow-900 border-yellow-300 font-semibold";
  }

  if (type === "confirmed") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold";
  }

  if (type === "upcoming") {
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (type === "installation") {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }

  if (type === "note") {
    return "bg-purple-100 text-purple-700 border-purple-200";
  }

  if (type === "blocked") {
    return "bg-slate-200 text-slate-700 border-slate-300";
  }

  if (type === "non_working") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function getEventLabel(type: CalendarEventType) {
  if (type === "overdue") return "Vencido";
  if (type === "today") return "Hoy";
  if (type === "confirmed") return "Confirmado";
  if (type === "upcoming") return "Próximo";
  if (type === "installation") return "Instalación";
  if (type === "note") return "Nota";
  if (type === "blocked") return "Fecha bloqueada";
  if (type === "non_working") return "Día no laborable";

  return "Evento";
}

export function getViewButtonClass(isActive: boolean) {
  if (isActive) {
    return "rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md";
  }

  return "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md";
}
