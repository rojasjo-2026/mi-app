"use client";

import Link from "next/link";
import {
  normalizeClientStatus,
  getClientStatusBadgeClass,
  getClientStatusLabel,
} from "@/lib/clients/clientStatus";
import {
  getClientFullName,
  getLocationLabel,
  formatDateLabel,
} from "@/lib/clients/clientList.utils";

type Client = {
  client_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  phone_primary: string;
  email?: string | null;
  client_status?: string | null;
  whatsapp_opt_in?: boolean | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  maintenance_count?: number;
  last_maintenance?: string | null;
  last_contact?: string | null;
};

type ClientListCardProps = {
  client: Client;
  onToggleStatus: (client: Client) => void;
};

export function ClientListCard({
  client,
  onToggleStatus,
}: ClientListCardProps) {
  const fullName = getClientFullName(client);
  const locationLabel = getLocationLabel(client);
  const status = normalizeClientStatus(client.client_status);
  const formattedLastMaintenance = formatDateLabel(client.last_maintenance);
  const formattedLastContact = formatDateLabel(client.last_contact);

  return (
    <li className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <Link href={`/clients/${client.client_id}`} className="block">
                <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900 transition group-hover:text-slate-700">
                  {fullName}
                </h2>
              </Link>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getClientStatusBadgeClass(
                    status,
                  )}`}
                >
                  {getClientStatusLabel(status)}
                </span>

                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {client.whatsapp_opt_in
                    ? "WhatsApp habilitado"
                    : "Sin WhatsApp"}
                </span>

                {typeof client.maintenance_count === "number" && (
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    {client.maintenance_count} mantenimiento
                    {client.maintenance_count === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link href={`/clients/${client.client_id}`} className="mt-5 block">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Teléfono
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {client.phone_primary}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Email
                </p>
                <p className="mt-2 break-words text-sm font-medium text-slate-800">
                  {client.email || "Sin email registrado"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Ubicación
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {locationLabel || "Sin ubicación registrada"}
                </p>
              </div>

              {formattedLastMaintenance && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Último mantenimiento
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {formattedLastMaintenance}
                  </p>
                </div>
              )}

              {formattedLastContact && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Último contacto
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {formattedLastContact}
                  </p>
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="flex flex-row flex-wrap gap-2 xl:w-auto xl:flex-col xl:items-end">
          <Link
            href={`/clients/${client.client_id}/edit`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Editar
          </Link>

          <button
            type="button"
            onClick={() => onToggleStatus(client)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {status === "INACTIVE" ? "Activar" : "Desactivar"}
          </button>
        </div>
      </div>
    </li>
  );
}
