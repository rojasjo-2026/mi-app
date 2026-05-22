"use client";

import { useMemo, useState } from "react";
import type { ClientActivityLog } from "@/lib/clients/clientDetail.types";
import {
  formatActivityValue,
  formatDateTimeLabel,
  getActivityActionLabel,
  getActivityCategoryClass,
  getActivityCategoryLabel,
  getActivityFieldLabel,
} from "@/lib/clients/clientDetail.utils";
import { MiniInfoCard } from "@/components/clients/detail/MiniInfoCard";

type ClientActivityHistoryProps = {
  activityLogs: ClientActivityLog[];
  loading: boolean;
  error: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
};

export function ClientActivityHistory({
  activityLogs,
  loading,
  error,
  hasMore,
  onLoadMore,
}: ClientActivityHistoryProps) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = useMemo(
    () => [
      "ALL",
      "INSTALLATION",
      "FILE",
      "FOLLOW_UP",
      "FINANCE",
      "CLIENT",
      "CONTACT",
    ],
    [],
  );

  const filteredLogs = useMemo(
    () =>
      selectedCategory === "ALL"
        ? activityLogs
        : activityLogs.filter(
            (activity) => activity.category === selectedCategory,
          ),
    [activityLogs, selectedCategory],
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm text-slate-500">
          Cargando historial del cliente...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-600">{error}</p>
      </div>
    );
  }

  if (activityLogs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
        <p className="text-sm font-medium text-slate-500">
          Aún no hay eventos registrados para este cliente.
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Los cambios de clientes, instalaciones, mantenimientos, archivos,
          contactos y finanzas aparecerán aquí automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                category === selectedCategory
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {category === "ALL"
                ? "Todos"
                : getActivityCategoryLabel(category)}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500">
          Mostrando {filteredLogs.length} de {activityLogs.length} eventos
        </p>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-semibold text-slate-600">
            No hay eventos para este filtro.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Probá con otra categoría o seleccioná Todos para ver el historial
            disponible.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((activity) => (
            <div
              key={activity.activity_id}
              className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getActivityCategoryClass(
                        activity.category,
                      )}`}
                    >
                      {getActivityCategoryLabel(activity.category)}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {getActivityActionLabel(activity.action)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {activity.title}
                  </p>

                  {activity.description && (
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {activity.description}
                    </p>
                  )}
                </div>

                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {formatDateTimeLabel(activity.created_at)}
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MiniInfoCard
                  label="Módulo"
                  value={getActivityCategoryLabel(activity.category)}
                />

                <MiniInfoCard
                  label="Campo"
                  value={getActivityFieldLabel(activity.field_name)}
                />

                <MiniInfoCard
                  label="Usuario"
                  value={activity.created_by || "Sistema"}
                />
              </div>

              {(activity.old_value || activity.new_value) && (
                <details className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                    Ver cambios
                  </summary>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Antes
                      </p>
                      <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-800">
                        {formatActivityValue(
                          activity.old_value,
                          activity.field_name,
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        Después
                      </p>
                      <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-800">
                        {formatActivityValue(
                          activity.new_value,
                          activity.field_name,
                        )}
                      </p>
                    </div>
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && onLoadMore && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mostrar más
          </button>
        </div>
      )}
    </div>
  );
}
