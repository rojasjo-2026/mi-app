import type { BusinessWeekDay } from "@prisma/client";

export type BusinessWorkingHourRecord = {
  business_working_hour_id: string;
  day_of_week: BusinessWeekDay;
  country_code: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type BusinessWorkingHourResponse = {
  id: string;
  day_of_week: BusinessWeekDay;
  country_code: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessWorkingHoursApiResponse = {
  success: boolean;
  data?:
    | BusinessWorkingHourResponse[]
    | BusinessWorkingHourResponse
    | { id: string };
  message?: string;
};

export type BusinessWorkingHourCreateInput = {
  day_of_week?: unknown;
  country_code?: unknown;
  is_working_day?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  break_start_time?: unknown;
  break_end_time?: unknown;
  notes?: unknown;
};

export type BusinessWorkingHourUpdateInput = {
  id?: unknown;
  day_of_week?: unknown;
  country_code?: unknown;
  is_working_day?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  break_start_time?: unknown;
  break_end_time?: unknown;
  notes?: unknown;
  is_active?: unknown;
};

export type NormalizedBusinessWorkingHourCreateInput = {
  day_of_week: BusinessWeekDay;
  country_code: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
  notes: string | null;
};

export type NormalizedBusinessWorkingHourUpdateInput = {
  id: string;
  day_of_week?: BusinessWeekDay;
  country_code?: string;
  is_working_day?: boolean;
  start_time?: string | null;
  end_time?: string | null;
  break_start_time?: string | null;
  break_end_time?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

export type BusinessWorkingHoursFilters = {
  country_code?: string;
  active_only?: boolean;
};

export type BusinessWorkingHoursServiceResult<T> = {
  status: number;
  body: {
    success: boolean;
    data?: T;
    message?: string;
  };
};
