"use client";

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

export function ClientDetailHeader({
  client,
  onEdit,
  onBack,
}: ClientDetailHeaderProps) {
  return (
    <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div className="space-y-3">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Perfil del cliente
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {getClientDisplayName(client)}
            </h1>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getClientStatusBadgeClass(
                client.client_status,
              )}`}
            >
              {getClientStatusLabel(client.client_status)}
            </span>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getWhatsAppBadgeClass(
                client.whatsapp_opt_in,
              )}`}
            >
              {client.whatsapp_opt_in ? "WhatsApp habilitado" : "Sin WhatsApp"}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            <span className="font-semibold text-slate-700">ID interno:</span>{" "}
            {client.client_id}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Volver
        </button>
      </div>
    </section>
  );
}
