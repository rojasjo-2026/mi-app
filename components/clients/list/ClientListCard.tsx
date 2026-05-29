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

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "C";
  }

  const first = parts[0]?.charAt(0) ?? "";
  const second = parts[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase();
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition group-hover:bg-white">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-800">
        {value}
      </p>
    </div>
  );
}

export function ClientListCard({
  client,
  onToggleStatus,
}: ClientListCardProps) {
  const fullName = getClientFullName(client);
  const initials = getInitials(fullName);
  const locationLabel = getLocationLabel(client);
  const status = normalizeClientStatus(client.client_status);
  const formattedLastMaintenance =
    formatDateLabel(client.last_maintenance) || "Sin registro";
  const formattedLastContact =
    formatDateLabel(client.last_contact) || "Sin registro";

  const maintenanceCount =
    typeof client.maintenance_count === "number" ? client.maintenance_count : 0;

  return (
    <li className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex flex-col gap-5 p-5 md:p-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <Link
              href={`/clients/${client.client_id}`}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-base font-black text-white shadow-sm transition group-hover:bg-blue-600"
              aria-label={`Ver detalle de ${fullName}`}
            >
              {initials}
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <Link href={`/clients/${client.client_id}`} className="block">
                    <h2 className="truncate text-2xl font-black tracking-tight text-slate-950 transition group-hover:text-blue-700">
                      {fullName}
                    </h2>
                  </Link>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Cliente registrado en CLARIUS Operations 360
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getClientStatusBadgeClass(
                      status,
                    )}`}
                  >
                    {getClientStatusLabel(status)}
                  </span>

                  <span
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                      client.whatsapp_opt_in
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {client.whatsapp_opt_in
                      ? "WhatsApp habilitado"
                      : "Sin WhatsApp"}
                  </span>

                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {maintenanceCount} mantenimiento
                    {maintenanceCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Link href={`/clients/${client.client_id}`} className="block">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <InfoTile
                icon="📞"
                label="Teléfono"
                value={client.phone_primary || "Sin teléfono"}
              />

              <InfoTile
                icon="✉️"
                label="Email"
                value={client.email || "Sin email registrado"}
              />

              <InfoTile
                icon="📍"
                label="Ubicación"
                value={locationLabel || "Sin ubicación registrada"}
              />

              <InfoTile
                icon="🛠️"
                label="Mantenimientos"
                value={`${maintenanceCount} registrados`}
              />

              <InfoTile
                icon="📅"
                label="Último mantenimiento"
                value={formattedLastMaintenance}
              />

              <InfoTile
                icon="💬"
                label="Último contacto"
                value={formattedLastContact}
              />
            </div>
          </Link>
        </div>

        <div className="flex flex-row flex-wrap gap-2 xl:w-36 xl:flex-col xl:items-stretch">
          <Link
            href={`/clients/${client.client_id}`}
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Ver detalle
          </Link>

          <Link
            href={`/clients/${client.client_id}/edit`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Editar
          </Link>

          <button
            type="button"
            onClick={() => onToggleStatus(client)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {status === "INACTIVE" ? "Activar" : "Desactivar"}
          </button>
        </div>
      </div>
    </li>
  );
}
