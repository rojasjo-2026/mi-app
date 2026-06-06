import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Phone,
  UserRound,
  Wrench,
} from "lucide-react";
import type { FollowUp } from "../types/followUpsPageTypes";
import { DetailField } from "./DetailField";
import {
  formatDateLabel,
  formatMaintenanceType,
  formatMoney,
  getBillingStatusClasses,
  getBillingStatusLabel,
  getClientName,
  getMainAmount,
  getPriorityClasses,
  getPriorityLabel,
  getStatusClasses,
  getTechnicianName,
  getTimingMeta,
} from "../utils/followUpsPageUtils";

export function FollowUpPreviewPanel({
  item,
  businessCurrency,
  businessLocale,
}: {
  item: FollowUp | null;
  businessCurrency: string;
  businessLocale: string;
}) {
  if (!item) {
    return (
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-bold text-slate-800">
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

  return (
    <aside className="sticky top-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Resumen de mantenimiento
        </p>

        <h2
          title={clientName}
          className="mt-2 line-clamp-2 text-xl font-black tracking-tight text-slate-950"
        >
          {clientName}
        </h2>

        <p
          title={maintenanceType}
          className="mt-1 truncate text-sm font-semibold text-slate-500"
        >
          {maintenanceType}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
              item.follow_up_status?.code,
            )}`}
          >
            {statusName}
          </span>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getPriorityClasses(
              item.priority,
            )}`}
          >
            {getPriorityLabel(item.priority)}
          </span>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${timingMeta.classes}`}
          >
            {timingMeta.label}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <DetailField
            label="Fecha objetivo"
            value={targetDate || "No disponible"}
          />
          <DetailField
            label="Fecha agendada"
            value={scheduledDate || "Sin agendar"}
          />
          <DetailField label="Fecha límite" value={dueDate || "No definida"} />
          <DetailField label="Técnico" value={technicianName} />
          <DetailField label="Monto" value={amountLabel} />
          <DetailField
            label="Teléfono"
            value={item.client?.phone_primary || "No disponible"}
          />
          <DetailField
            label="Facturación"
            value={getBillingStatusLabel(item.billing_status)}
          />
          <DetailField label="Instalación">
            <span title={installationName} className="block truncate">
              {installationName}
            </span>
          </DetailField>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-950">Acciones rápidas</p>
          <p className="mt-1 text-xs font-medium leading-5 text-blue-700">
            Usa este panel para trabajar con el mantenimiento seleccionado sin
            perder la lista.
          </p>
        </div>

        <div className="grid gap-2">
          <Link
            href={`/follow-ups/${item.follow_up_id}`}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Ver detalle completo
          </Link>

          <Link
            href={`/contact-attempts/new?follow_up_id=${item.follow_up_id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Registrar intento
          </Link>

          <Link
            href={`/clients/${item.client_id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Ver cliente
          </Link>

          {item.installation_id && (
            <Link
              href={`/installations/${item.installation_id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver instalación
            </Link>
          )}
        </div>

        {installationDate && (
          <p className="text-xs font-medium text-slate-500">
            Fecha de instalación: {installationDate}
          </p>
        )}
      </div>
    </aside>
  );
}

