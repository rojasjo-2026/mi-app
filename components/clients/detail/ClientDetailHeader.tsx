"use client";

import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Copy,
  Pencil,
} from "lucide-react";
import type { ClientDetail } from "@/lib/clients/clientDetail.types";
import { getFullName } from "@/lib/utils/getFullName";
import {
  getClientStatusBadgeClass,
  getClientStatusLabel,
} from "@/lib/clients/clientStatus";
import { getWhatsAppBadgeClass } from "@/lib/clients/clientDetail.utils";

type ClientDetailHeaderProps = {
  client: ClientDetail;
  installationsCount: number;
  onEdit: () => void;
  onBack: () => void;
  onCreateInstallation: () => void;
  onScheduleMaintenance: () => void;
};

function getClientDisplayName(client: ClientDetail) {
  return client.display_name || getFullName(client);
}

function getShortClientId(clientId: string) {
  return `${clientId.slice(0, 8)}...${clientId.slice(-6)}`;
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "CL";
  }

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase();
}

export function ClientDetailHeader({
  client,
  installationsCount,
  onEdit,
  onBack,
  onCreateInstallation,
  onScheduleMaintenance,
}: ClientDetailHeaderProps) {
  const displayName = getClientDisplayName(client);
  const initials = getInitials(displayName);
  const hasInstallations = installationsCount > 0;

  async function handleCopyClientId() {
    await navigator.clipboard.writeText(client.client_id);
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Clientes</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">
              Detalle del cliente
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a clientes
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar cliente
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1fr_360px] xl:items-center">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-2xl font-semibold text-blue-700 md:h-20 md:w-20">
            {initials}

            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-500" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
                {displayName}
              </h1>

              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getClientStatusBadgeClass(
                  client.client_status,
                )}`}
              >
                {getClientStatusLabel(client.client_status)}
              </span>

              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getWhatsAppBadgeClass(
                  client.whatsapp_opt_in,
                )}`}
              >
                {client.whatsapp_opt_in
                  ? "WhatsApp habilitado"
                  : "Sin WhatsApp"}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  ID interno:
                </span>

                <span className="font-mono text-[11px] text-slate-500">
                  {getShortClientId(client.client_id)}
                </span>

                <button
                  type="button"
                  onClick={handleCopyClientId}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  title="Copiar ID interno"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm text-blue-600">⚡</span>
            <h2 className="text-xs font-semibold text-slate-900">
              Acciones rápidas
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCreateInstallation}
              className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <Building2 className="h-4 w-4" />
              </span>

              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-900">
                  Crear instalación
                </span>
                <span className="block truncate text-[11px] text-slate-500">
                  Nuevo activo del cliente
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={hasInstallations ? onScheduleMaintenance : undefined}
              disabled={!hasInstallations}
              className={[
                "flex items-center gap-2.5 rounded-md border px-3 py-2 text-left shadow-sm transition",
                hasInstallations
                  ? "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  hasInstallations
                    ? "bg-violet-50 text-violet-600"
                    : "bg-slate-200 text-slate-400",
                ].join(" ")}
              >
                <CalendarClock className="h-4 w-4" />
              </span>

              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-900">
                  Agendar mantenimiento
                </span>
                <span className="block truncate text-[11px] text-slate-500">
                  {hasInstallations
                    ? "Programar servicio"
                    : "Requiere instalación"}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
