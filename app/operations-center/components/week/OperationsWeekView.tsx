import type { AvailabilityByDateMap, CalendarEvent } from "../../types";

import {
  buildOperationsWeekDayCards,
  buildOperationsWeekDayDetail,
  buildOperationsWeekSummary,
  buildOperationsWeekZoneDistribution,
} from "./operationsWeekUtils";
import { OperationsWeekDayCards } from "./OperationsWeekDayCards";
import { OperationsWeekDayDetail } from "./OperationsWeekDayDetail";
import { OperationsWeekSummary } from "./OperationsWeekSummary";
import { OperationsWeekZoneDistribution } from "./OperationsWeekZoneDistribution";

type OperationsWeekViewProps = {
  selectedDate: string;
  events: CalendarEvent[];
  availabilityByDate: AvailabilityByDateMap;
  loadingAvailability: boolean;
  onSelectDate: (date: string) => void;
  onOpenDayView: () => void;
};

export function OperationsWeekView({
  selectedDate,
  events,
  availabilityByDate,
  loadingAvailability,
  onSelectDate,
  onOpenDayView,
}: OperationsWeekViewProps) {
  const dayCards = buildOperationsWeekDayCards({
    selectedDate,
    events,
    availabilityByDate,
    loadingAvailability,
  });

  const summary = buildOperationsWeekSummary(dayCards);
  const zones = buildOperationsWeekZoneDistribution({
    selectedDate,
    events,
  });

  const detail = buildOperationsWeekDayDetail({
    selectedDate,
    dayCards,
    events,
  });

  return (
    <section className="flex min-w-0 flex-col gap-5">
      <OperationsWeekSummary summary={summary} />

      <OperationsWeekDayCards
        dayCards={dayCards}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <OperationsWeekZoneDistribution zones={zones} />

        <OperationsWeekDayDetail
          selectedDate={selectedDate}
          detail={detail}
          onOpenDayView={onOpenDayView}
        />
      </section>
    </section>
  );
}
