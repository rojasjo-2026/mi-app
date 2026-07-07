"use client";

import { useState } from "react";

import { useAppSettings } from "@/app/hooks/useAppSettings";

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

  const { countryCode, settingsError } = useAppSettings();

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
  } = useOperationsCenterData(countryCode, viewMode);

  function handleUseGroupAsRoute(routeStops: string[]) {
    setRouteStopsText(routeStops.join("\n"));
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
        <OperationsHeader
          selectedDate={selectedDate}
          viewMode={viewMode}
          onDateChange={setSelectedDate}
          onViewModeChange={setViewMode}
        />

        {settingsError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 shadow-sm">
            No se pudo cargar la configuración de la app. Se está usando la
            configuración base.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
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

            <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <OperationsWorkList
                selectedDateEvents={selectedDateEvents}
                loadingEvents={loadingEvents}
                onRefresh={() => void loadCalendarEvents()}
              />

              <div className="flex min-w-0 flex-col gap-5">
                <OperationsRoutePanel
                  routeStopsText={routeStopsText}
                  onRouteStopsTextChange={setRouteStopsText}
                  countryCode={countryCode}
                />

                <OperationsAvailabilityPanel
                  availability={availability}
                  loadingAvailability={loadingAvailability}
                />
              </div>
            </section>
          </>
        ) : (
          <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <OperationsRangeGroups
              events={events}
              selectedDate={selectedDate}
              viewMode={viewMode}
              availabilityByDate={availabilityByDate}
              loadingAvailability={loadingAvailability}
              onUseGroupAsRoute={handleUseGroupAsRoute}
            />

            <div className="flex min-w-0 flex-col gap-5">
              <OperationsRoutePanel
                routeStopsText={routeStopsText}
                onRouteStopsTextChange={setRouteStopsText}
                countryCode={countryCode}
              />

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-500 shadow-sm">
                En la vista de {viewMode === "week" ? "semana" : "mes"}, las
                agrupaciones se muestran según las rutas configuradas y los
                trabajos programados dentro del rango seleccionado.
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
