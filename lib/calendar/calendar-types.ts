export type CalendarEventType =
  | "overdue"
  | "today"
  | "confirmed"
  | "upcoming"
  | "installation"
  | "note"
  | "blocked";

export type CalendarViewMode = "month" | "week" | "day";

export type CalendarEvent = {
  id: string;
  date: string;
  type: CalendarEventType;
  title: string;
  description?: string;
};

export type ContextMenuState = {
  x: number;
  y: number;
  date: Date;
  event?: CalendarEvent;
} | null;
