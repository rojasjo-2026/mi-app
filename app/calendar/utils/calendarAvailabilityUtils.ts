import type {
  AvailabilityRangeResponse,
  CalendarAvailabilityDay,
} from "../types/calendarAvailabilityTypes";

export function getInclusiveDayCount(startDate: Date, endDate: Date) {
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

export function mapAvailabilityByDate(items: CalendarAvailabilityDay[]) {
  return items.reduce<Record<string, CalendarAvailabilityDay>>((acc, item) => {
    acc[item.date] = item;
    return acc;
  }, {});
}

export function isAvailabilityRangeData(
  data: AvailabilityRangeResponse["data"],
): data is { results?: CalendarAvailabilityDay[] } {
  return Boolean(data && "results" in data);
}

export function isAvailabilityDayData(
  data: AvailabilityRangeResponse["data"],
): data is CalendarAvailabilityDay {
  return Boolean(
    data && "date" in data && "workload" in data && "capacity" in data,
  );
}

