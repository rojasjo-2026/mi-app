"use client";

import { useState } from "react";

import { OperationsAvailabilityPanel } from "./components/OperationsAvailabilityPanel";
import { OperationsHeader } from "./components/OperationsHeader";
import { OperationsRangeGroups } from "./components/OperationsRangeGroups";
import { OperationsRoutePanel } from "./components/OperationsRoutePanel";
import { OperationsSummaryCards } from "./components/OperationsSummaryCards";
import { OperationsWorkList } from "./components/OperationsWorkList";
import { OperationsZoneGroups } from "./components/OperationsZoneGroups";
import { useOperationsCenterData } from "./hooks/useOperationsCenterData";
import type { OperationsViewMode } from "./types";

export default function OperationsCenterPage() {
  const [routeStopsText, setRouteStopsText] = useState("");
  const [viewMode, setViewMode] = useState<OperationsViewMode>("day");

  const {
    selectedDate,
    setSelectedDate,

    events,
    selectedDateEvents,
    installations,
    maintenances,
    availability,
    availabilityByDate,

    loadingEvents,
    loadingAvailability,
    error,

    loadCalendarEvents,
  } = useOperationsCenterData("CR", viewMode);

  function handleUseGroupAsRoute(routeStops: string[]) {
    setRouteStopsText(routeStops.join("\n"));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <OperationsHeader
          selectedDate={selectedDate}
          viewMode={viewMode}
          onDateChange={setSelectedDate}
          onViewModeChange={setViewMode}
        />

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {viewMode === "day" ? (
          <>
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
          </>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <OperationsRangeGroups
              events={events}
              selectedDate={selectedDate}
              viewMode={viewMode}
              availabilityByDate={availabilityByDate}
              loadingAvailability={loadingAvailability}
              onUseGroupAsRoute={handleUseGroupAsRoute}
            />

            <div className="space-y-6">
              <OperationsRoutePanel
                routeStopsText={routeStopsText}
                onRouteStopsTextChange={setRouteStopsText}
              />

              <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-500 shadow-sm">
                En la vista de {viewMode === "week" ? "semana" : "mes"}, las
                agrupaciones se muestran según las rutas configuradas y los
                trabajos programados dentro del rango seleccionado.
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
