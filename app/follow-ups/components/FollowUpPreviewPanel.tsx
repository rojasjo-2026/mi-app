import Link from "next/link";
import { Wrench } from "lucide-react";
import type { FollowUp } from "../types/followUpsPageTypes";
import { DetailField } from "./DetailField";
import {
  formatDateLabel,
  formatMaintenanceType,
  formatMoney,
  getBillingStatusLabel,
  getClientName,
  getMainAmount,
  getPriorityClasses,
  getPriorityLabel,
  getStatusClasses,
  getTechnicianName,
  getTimingMeta,
} from "../utils/followUpsPageUtils";

type FollowUpPreviewPanelProps = {
  item: FollowUp | null;
  businessCurrency: string;
  businessLocale: string;
};

function OperationalStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        title={value}
        className="mt-1 truncate text-sm font-semibold text-slate-950"
      >
        {value}
      </p>

      {helper && (
        <p className="mt-1 truncate text-xs font-medium text-slate-500">
          {helper}
        </p>
      )}
    </div>
  );
}

export function FollowUpPreviewPanel({
  item,
  businessCurrency,
  businessLocale,
}: FollowUpPreviewPanelProps) {
  if (!item) {
    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-semibold text-slate-800">
          Resumen de mantenimiento
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Selecciona un mantenimiento de la tabla para ver su información y
          acciones rápidas.
        </p>
      </aside>
    );
  }

  const clientName = getClientName(item.client);
  const maintenanceType = formatMaintenanceType(item.maintenance_type);
  const technicianName = getTechnicianName(item.technician);
  const timingMeta = getTimingMeta(
    item.target_date,
    item.follow_up_status?.code,
  );
  const targetDate = formatDateLabel(item.target_date, businessLocale);
  const scheduledDate = formatDateLabel(item.scheduled_date, businessLocale);
  const dueDate = formatDateLabel(item.due_date, businessLocale);
  const installationDate = formatDateLabel(
    item.installation?.installation_date,
    businessLocale,
  );
  const amount = getMainAmount(item);
  const amountLabel =
    amount === null
      ? "No definido"
      : formatMoney(amount, businessCurrency, businessLocale);
  const statusName = item.follow_up_status?.name || "Sin estado";
  const installationName =
    item.installation?.description || "Sin instalación asociada";
  const phone = item.client?.phone_primary || "No disponible";

  return (
    <aside className="sticky top-6 z-10 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Wrench className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Mantenimiento seleccionado
            </p>

            <h2
              title={clientName}
              className="mt-1 line-clamp-2 text-base font-semibold tracking-tight text-slate-950"
            >
              {clientName}
            </h2>

            <p
              title={maintenanceType}
              className="mt-1 truncate text-sm font-medium text-slate-500"
            >
              {maintenanceType}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusClasses(
                  item.follow_up_status?.code,
                )}`}
              >
                {statusName}
              </span>

              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityClasses(
                  item.priority,
                )}`}
              >
                {getPriorityLabel(item.priority)}
              </span>

              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${timingMeta.classes}`}
              >
                {timingMeta.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Acciones rápidas
          </p>

          <div className="grid gap-2">
            <Link
              href={`/follow-ups/${item.follow_up_id}`}
              className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ver detalle completo
            </Link>

            <Link
              href={`/contact-attempts/new?follow_up_id=${item.follow_up_id}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Registrar intento
            </Link>

            <Link
              href={`/clients/${item.client_id}`}
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Ver cliente
            </Link>

            {item.installation_id && (
              <Link
                href={`/installations/${item.installation_id}`}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Ver instalación
              </Link>
            )}
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Situación operativa
          </p>

          <div className="grid grid-cols-2 gap-2">
            <OperationalStat
              label="Objetivo"
              value={targetDate || "No disponible"}
              helper="Fecha objetivo"
            />

            <OperationalStat
              label="Agendada"
              value={scheduledDate || "Sin agendar"}
              helper="Agenda"
            />

            <OperationalStat
              label="Límite"
              value={dueDate || "No definida"}
              helper="Fecha límite"
            />

            <OperationalStat
              label="Técnico"
              value={technicianName}
              helper="Responsable"
            />

            <OperationalStat label="Monto" value={amountLabel} helper="Total" />

            <OperationalStat
              label="Facturación"
              value={getBillingStatusLabel(item.billing_status)}
              helper="Estado"
            />
          </div>
        </section>

        <section>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Información principal
          </p>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <DetailField label="Cliente" value={clientName} />

            <DetailField label="Teléfono" value={phone} />

            <DetailField label="Instalación">
              <span title={installationName} className="block truncate">
                {installationName}
              </span>
            </DetailField>

            <DetailField label="Tipo" value={maintenanceType} />
          </div>
        </section>

        {installationDate && (
          <p className="text-xs font-medium text-slate-500">
            Fecha de instalación: {installationDate}
          </p>
        )}
      </div>
    </aside>
  );
}
