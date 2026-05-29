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
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 md:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span>Clientes</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800">Detalle del cliente</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a clientes
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Pencil className="h-4 w-4" />
              Editar cliente
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 md:p-7 xl:grid-cols-[1fr_420px] xl:items-center">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-blue-50 text-4xl font-black text-blue-700 md:h-28 md:w-28">
            {initials}

            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white bg-emerald-500" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                {displayName}
              </h1>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getClientStatusBadgeClass(
                  client.client_status,
                )}`}
              >
                {getClientStatusLabel(client.client_status)}
              </span>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getWhatsAppBadgeClass(
                  client.whatsapp_opt_in,
                )}`}
              >
                {client.whatsapp_opt_in
                  ? "WhatsApp habilitado"
                  : "Sin WhatsApp"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <span className="font-bold text-slate-800">ID interno:</span>

                <span className="font-mono text-xs text-slate-500">
                  {getShortClientId(client.client_id)}
                </span>

                <button
                  type="button"
                  onClick={handleCopyClientId}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  title="Copiar ID interno"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-blue-600">⚡</span>
            <h2 className="text-sm font-black text-slate-900">
              Acciones rápidas
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCreateInstallation}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 className="h-5 w-5" />
              </span>

              <span>
                <span className="block text-sm font-bold text-slate-900">
                  Crear instalación
                </span>
                <span className="block text-xs font-medium text-slate-500">
                  Nuevo activo del cliente
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={hasInstallations ? onScheduleMaintenance : undefined}
              disabled={!hasInstallations}
              className={[
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition",
                hasInstallations
                  ? "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  hasInstallations
                    ? "bg-violet-50 text-violet-600"
                    : "bg-slate-200 text-slate-400",
                ].join(" ")}
              >
                <CalendarClock className="h-5 w-5" />
              </span>

              <span>
                <span className="block text-sm font-bold text-slate-900">
                  Agendar mantenimiento
                </span>
                <span className="block text-xs font-medium text-slate-500">
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
