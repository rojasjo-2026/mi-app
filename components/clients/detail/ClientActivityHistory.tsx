"use client";

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
};

export function ClientActivityHistory({
  activityLogs,
  loading,
  error,
}: ClientActivityHistoryProps) {
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
    <div className="space-y-3">
      {activityLogs.map((activity) => (
        <div
          key={activity.activity_id}
          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getActivityCategoryClass(
                    activity.category,
                  )}`}
                >
                  {getActivityCategoryLabel(activity.category)}
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {getActivityActionLabel(activity.action)}
                </span>
              </div>

              <p className="text-sm font-bold text-slate-900">
                {activity.title}
              </p>

              {activity.description && (
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {activity.description}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
              {formatDateTimeLabel(activity.created_at)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
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
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Antes
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                  {formatActivityValue(activity.old_value, activity.field_name)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Después
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                  {formatActivityValue(activity.new_value, activity.field_name)}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
