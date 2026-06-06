export type CalendarAvailabilityDay = {
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

export type AvailabilityRangeResponse = {
  success: boolean;
  data?:
    | CalendarAvailabilityDay
    | {
        results?: CalendarAvailabilityDay[];
      };
  message?: string;
};

