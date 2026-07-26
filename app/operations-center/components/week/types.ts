import type { AvailabilityData, CalendarEvent } from "../../types";

export type OperationsWeekDayStatus =
  | "Disponible"
  | "No disponible"
  | "Sin evaluación"
  | "Evaluando";

export type OperationsWeekDayCard = {
  date: string;
  dayLabel: string;
  fullDateLabel: string;
  totalJobs: number;
  totalInstallations: number;
  totalMaintenances: number;
  capacityLabel: string;
  status: OperationsWeekDayStatus;
  availability: AvailabilityData | null;
};

export type OperationsWeekSummary = {
  totalJobs: number;
  daysWithActivity: number;
  blockedDays: number;
  averageWeeklyLoadPct: number | null;
  averageWeeklyLoadSampleSize: number;
};

export type OperationsWeekZoneDistributionItem = {
  zoneKey: string;
  zoneName: string;
  referenceAddress: string | null;
  totalJobs: number;
  totalInstallations: number;
  totalMaintenances: number;
  events: CalendarEvent[];
};

export type OperationsWeekDayDetail = {
  status: OperationsWeekDayStatus;
  capacityLabel: string;
  remainingCapacityLabel: string;
  blockedReason: string | null;
  events: CalendarEvent[];
  availability: AvailabilityData | null;
};
