"use client";

import { useMemo, useState } from "react";

import type { OperationsWeekDayDetail as OperationsWeekDayDetailType } from "./types";

type OperationsWeekDayDetailProps = {
  selectedDate: string;
  detail: OperationsWeekDayDetailType | null;
  onOpenDayView: () => void;
};

function getStatusClasses(status: OperationsWeekDayDetailType["status"]) {
  if (status === "Disponible") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "No disponible") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function OperationsWeekDayDetail({
  selectedDate,
  detail,
  onOpenDayView,
}: OperationsWeekDayDetailProps) {
  const [showWorkItems, setShowWorkItems] = useState(true);

  const workItems = useMemo(() => detail?.events ?? [], [detail]);

  if (!detail) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">
          No hay detalle disponible para esta fecha.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">
            Detalle del día {selectedDate}
          </h2>

          <button
            type="button"
            onClick={onOpenDayView}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Ir a vista Día
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(detail.status)}`}
          >
            {detail.status}
          </span>

          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            Capacidad: {detail.capacityLabel}
          </span>

          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {detail.remainingCapacityLabel}
          </span>
        </div>

        {detail.blockedReason ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-700">
            Motivo del bloqueo: {detail.blockedReason}
          </p>
        ) : null}
      </div>

      <div className="px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">
            Trabajos del día ({workItems.length})
          </p>

          <button
            type="button"
            onClick={() => setShowWorkItems((current) => !current)}
            className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {showWorkItems ? "Ocultar trabajos" : "Mostrar trabajos"}
          </button>
        </div>

        {showWorkItems ? (
          <div className="max-h-[clamp(220px,34vh,420px)] space-y-2 overflow-y-auto pr-1">
            {workItems.length === 0 ? (
              <p className="text-sm leading-6 text-slate-500">
                No hay trabajos programados para este día.
              </p>
            ) : (
              workItems.map((event) => (
                <article
                  key={event.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {event.title}
                  </p>

                  {event.description ? (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {event.description}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-500">
            Lista de trabajos oculta.
          </p>
        )}
      </div>
    </section>
  );
}
