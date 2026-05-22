"use client";

import { Copy } from "lucide-react";
import type { ClientDetail } from "@/lib/clients/clientDetail.types";
import { getFullName } from "@/lib/utils/getFullName";
import {
  getClientStatusBadgeClass,
  getClientStatusLabel,
} from "@/lib/clients/clientStatus";
import { getWhatsAppBadgeClass } from "@/lib/clients/clientDetail.utils";

type ClientDetailHeaderProps = {
  client: ClientDetail;
  onEdit: () => void;
  onBack: () => void;
};

function getClientDisplayName(client: ClientDetail) {
  return client.display_name || getFullName(client);
}

function getShortClientId(clientId: string) {
  return `${clientId.slice(0, 8)}...${clientId.slice(-6)}`;
}

export function ClientDetailHeader({
  client,
  onEdit,
  onBack,
}: ClientDetailHeaderProps) {
  async function handleCopyClientId() {
    await navigator.clipboard.writeText(client.client_id);
  }

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
            Perfil del cliente
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 md:text-5xl">
                {getClientDisplayName(client)}
              </h1>

              <span
                className={`inline-flex rounded-full px-3.5 py-1.5 text-xs font-bold ${getClientStatusBadgeClass(
                  client.client_status,
                )}`}
              >
                {getClientStatusLabel(client.client_status)}
              </span>

              <span
                className={`inline-flex rounded-full px-3.5 py-1.5 text-xs font-bold ${getWhatsAppBadgeClass(
                  client.whatsapp_opt_in,
                )}`}
              >
                {client.whatsapp_opt_in
                  ? "WhatsApp habilitado"
                  : "Sin WhatsApp"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">
                  ID interno:
                </span>
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

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            Editar cliente
          </button>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Volver
          </button>
        </div>
      </div>
    </section>
  );
}
