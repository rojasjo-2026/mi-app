import type { AvailabilityData, CalendarEvent } from "../../types";

export type OperationsMonthDayData = {
  date: string;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
  totalJobs: number;
  totalInstallations: number;
  totalMaintenances: number;
  availability: AvailabilityData | null;
};

export type OperationsMonthZoneData = {
  zoneKey: string;
  zoneName: string;
  referenceAddress: string | null;
  totalJobs: number;
  totalInstallations: number;
  totalMaintenances: number;
};

export type OperationsMonthAvailabilityStatus =
  | "loading"
  | "available"
  | "unavailable"
  | "unevaluated";
