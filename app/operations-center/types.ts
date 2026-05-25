export type CalendarEvent = {
  id: string;
  entity_type: string;
  date: string;
  type?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  billing_status?: string;
  is_confirmed?: boolean;
  is_completed?: boolean;

  operational_zone_id?: string | null;
  operational_zone_name?: string | null;
  operational_zone_reference_address?: string | null;

  route_address?: string | null;
  route_latitude?: number | null;
  route_longitude?: number | null;
};

export type AvailabilityData = {
  country_code: string;
  date: string;
  operational_zone_id?: string | null;
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

export type AvailabilityRangeData = {
  country_code: string;
  start_date: string;
  days: number;
  operational_zone_id: string | null;
  results: AvailabilityData[];
};

export type CalendarApiResponse = {
  success: boolean;
  data?: CalendarEvent[];
  message?: string;
};

export type AvailabilityApiResponse = {
  success: boolean;
  data?: AvailabilityData;
  message?: string;
};

export type AvailabilityRangeApiResponse = {
  success: boolean;
  data?: AvailabilityRangeData;
  message?: string;
};

export type OperationsZoneGroup = {
  zone_id: string | null;
  zone_name: string;
  reference_address: string | null;
  events: CalendarEvent[];
  total_jobs: number;
  total_installations: number;
  total_maintenances: number;
  route_stops: string[];
};

export type OperationsViewMode = "day" | "week" | "month";

export type AvailabilityByDateMap = Record<string, AvailabilityData>;
