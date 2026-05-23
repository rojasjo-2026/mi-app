import type {
  BusinessWorkingHourRecord,
  BusinessWorkingHourResponse,
} from "@/lib/business-working-hours/businessWorkingHours.types";

export function mapBusinessWorkingHour(
  workingHour: BusinessWorkingHourRecord,
): BusinessWorkingHourResponse {
  return {
    id: workingHour.business_working_hour_id,
    day_of_week: workingHour.day_of_week,
    country_code: workingHour.country_code,
    is_working_day: workingHour.is_working_day,
    start_time: workingHour.start_time,
    end_time: workingHour.end_time,
    break_start_time: workingHour.break_start_time,
    break_end_time: workingHour.break_end_time,
    notes: workingHour.notes,
    is_active: workingHour.is_active,
    created_at: workingHour.created_at.toISOString(),
    updated_at: workingHour.updated_at.toISOString(),
  };
}

export function mapBusinessWorkingHours(
  workingHours: BusinessWorkingHourRecord[],
): BusinessWorkingHourResponse[] {
  return workingHours.map(mapBusinessWorkingHour);
}
