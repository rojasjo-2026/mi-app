"use client";

import { useState } from "react";

import { OperationsAvailabilityPanel } from "./components/OperationsAvailabilityPanel";
import { OperationsHeader } from "./components/OperationsHeader";
import { OperationsRoutePanel } from "./components/OperationsRoutePanel";
import { OperationsSummaryCards } from "./components/OperationsSummaryCards";
import { OperationsWorkList } from "./components/OperationsWorkList";
import { OperationsZoneGroups } from "./components/OperationsZoneGroups";
import { useOperationsCenterData } from "./hooks/useOperationsCenterData";

export default function OperationsCenterPage() {
  const [routeStopsText, setRouteStopsText] = useState("");

  const {
    selectedDate,
    setSelectedDate,

    selectedDateEvents,
    installations,
    maintenances,
    availability,

    loadingEvents,
    loadingAvailability,
    error,

    loadCalendarEvents,
  } = useOperationsCenterData("CR");

  function handleUseGroupAsRoute(routeStops: string[]) {
    setRouteStopsText(routeStops.join("\n"));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <OperationsHeader
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <OperationsSummaryCards
          selectedDateEvents={selectedDateEvents}
          installations={installations}
          maintenances={maintenances}
          availability={availability}
          loadingEvents={loadingEvents}
          loadingAvailability={loadingAvailability}
        />

        <OperationsZoneGroups
          selectedDateEvents={selectedDateEvents}
          onUseGroupAsRoute={handleUseGroupAsRoute}
        />

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <OperationsWorkList
            selectedDateEvents={selectedDateEvents}
            loadingEvents={loadingEvents}
            onRefresh={() => void loadCalendarEvents()}
          />

          <div className="space-y-6">
            <OperationsRoutePanel
              routeStopsText={routeStopsText}
              onRouteStopsTextChange={setRouteStopsText}
            />

            <OperationsAvailabilityPanel
              availability={availability}
              loadingAvailability={loadingAvailability}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
