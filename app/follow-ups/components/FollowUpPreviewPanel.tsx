"use client";

import Link from "next/link";
import { Wrench, X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { FollowUp } from "../types/followUpsPageTypes";
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
import { DetailField } from "./DetailField";

type FollowUpPreviewPanelProps = {
  item: FollowUp | null;
  businessCurrency: string;
  businessLocale: string;
  onClose: () => void;
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

      {helper ? (
        <p className="mt-1 truncate text-xs font-medium text-slate-500">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export function FollowUpPreviewPanel({
  item,
  businessCurrency,
  businessLocale,
  onClose,
}: FollowUpPreviewPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!item) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (
        target instanceof Element &&
        target.closest('[data-follow-up-row="true"]')
      ) {
        return;
      }

      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [item, onClose]);

  if (!item) {
    return null;
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
    <aside
      ref={panelRef}
      role="dialog"
      aria-labelledby="follow-up-preview-title"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-slate-200 bg-white shadow-2xl"
    >
      <div className="shrink-0 border-b border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Wrench className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Mantenimiento seleccionado
            </p>

            <h2
              id="follow-up-preview-title"
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

          <button
            type="button"
            onClick={onClose}
            title="Cerrar"
            aria-label="Cerrar panel de mantenimiento"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section className="shrink-0 border-b border-slate-200 p-5">
        <p className="mb-2 text-sm font-semibold text-slate-800">
          Acciones rápidas
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href={`/follow-ups/${item.follow_up_id}`}
            className="inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-950 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
          >
            Ver detalle completo
          </Link>

          <Link
            href={`/contact-attempts/new?follow_up_id=${item.follow_up_id}`}
            className="inline-flex cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            Registrar intento
          </Link>

          <Link
            href={`/clients/${item.client_id}`}
            className="inline-flex cursor-pointer items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            Ver cliente
          </Link>

          {item.installation_id ? (
            <Link
              href={`/installations/${item.installation_id}`}
              className="inline-flex cursor-pointer items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
            >
              Ver instalación
            </Link>
          ) : null}
        </div>
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="space-y-5">
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

              <OperationalStat
                label="Monto"
                value={amountLabel}
                helper="Total"
              />

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

            <div className="grid gap-2 sm:grid-cols-2">
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

          {installationDate ? (
            <p className="text-xs font-medium text-slate-500">
              Fecha de instalación: {installationDate}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
