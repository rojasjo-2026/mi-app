"use client";

import type { ReactNode } from "react";
import { Mail, MapPin, Phone, Wrench } from "lucide-react";
import {
  normalizeClientStatus,
  getClientStatusBadgeClass,
  getClientStatusLabel,
  type ClientStatus,
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
  client_status?: ClientStatus | null;
  whatsapp_opt_in?: boolean | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  maintenance_count?: number;
  installation_count?: number;
  last_maintenance?: string | null;
  last_contact?: string | null;
};

type VisibleClientColumns = {
  contact: boolean;
  location: boolean;
  operation: boolean;
  activity: boolean;
  status: boolean;
};

type ClientListCardProps = {
  client: Client;
  isSelected: boolean;
  onSelect: () => void;
  gridTemplateColumns: string;
  visibleColumns: VisibleClientColumns;
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

function getLastActivityLabel(client: Client) {
  const lastContact = formatDateLabel(client.last_contact);
  const lastMaintenance = formatDateLabel(client.last_maintenance);

  if (lastContact) {
    return {
      main: lastContact,
      helper: "Último contacto",
    };
  }

  if (lastMaintenance) {
    return {
      main: lastMaintenance,
      helper: "Último mantenimiento",
    };
  }

  return {
    main: "Sin registro",
    helper: "Sin actividad reciente",
  };
}

function ClientMetaItem({
  icon,
  value,
  muted,
}: {
  icon: ReactNode;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-slate-400">{icon}</span>

      <span
        title={value}
        className={[
          "truncate text-sm font-medium",
          muted ? "text-slate-400" : "text-slate-700",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function TableCell({
  children,
  align = "left",
  sticky,
  selected = false,
}: {
  children: ReactNode;
  align?: "left" | "center" | "right";
  sticky?: "left";
  selected?: boolean;
}) {
  const alignClass =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
        ? "justify-center text-center"
        : "justify-start text-left";

  const stickyClass =
    sticky === "left"
      ? [
          "sticky left-0 z-20 border-r border-slate-100 shadow-[10px_0_18px_-18px_rgba(15,23,42,0.35)]",
          selected ? "bg-blue-50" : "bg-white group-hover:bg-slate-50",
        ].join(" ")
      : "";

  return (
    <div
      className={[
        "flex min-w-0 items-center border-l border-slate-100 px-4 py-2.5 first:border-l-0",
        alignClass,
        stickyClass,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function ClientListCard({
  client,
  isSelected,
  onSelect,
  gridTemplateColumns,
  visibleColumns,
}: ClientListCardProps) {
  const fullName = getClientFullName(client);
  const initials = getInitials(fullName);
  const locationLabel = getLocationLabel(client);
  const status: ClientStatus =
    normalizeClientStatus(client.client_status) ?? "ACTIVE";

  const maintenanceCount =
    typeof client.maintenance_count === "number" ? client.maintenance_count : 0;

  const installationCount =
    typeof client.installation_count === "number"
      ? client.installation_count
      : 0;

  const lastActivity = getLastActivityLabel(client);

  return (
    <li
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      style={{ gridTemplateColumns }}
      className={[
        "group grid min-h-[60px] cursor-pointer border-b border-l-2 border-slate-100 transition last:border-b-0 hover:bg-slate-50",
        isSelected
          ? "border-l-blue-600 bg-blue-50"
          : "border-l-transparent bg-white",
      ].join(" ")}
    >
      <TableCell sticky="left" selected={isSelected}>
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition",
              isSelected
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
            ].join(" ")}
          >
            {initials}
          </div>

          <div className="min-w-0">
            <h2
              title={fullName}
              className="truncate text-sm font-semibold tracking-tight text-slate-950"
            >
              {fullName}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Cliente
              </span>

              {client.whatsapp_opt_in && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  WhatsApp
                </span>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      {visibleColumns.contact && (
        <TableCell>
          <div className="min-w-0 space-y-1">
            <ClientMetaItem
              icon={<Phone className="h-3.5 w-3.5" />}
              value={client.phone_primary || "Sin teléfono"}
              muted={!client.phone_primary}
            />

            <ClientMetaItem
              icon={<Mail className="h-3.5 w-3.5" />}
              value={client.email || "Sin email"}
              muted={!client.email}
            />
          </div>
        </TableCell>
      )}

      {visibleColumns.location && (
        <TableCell>
          <ClientMetaItem
            icon={<MapPin className="h-3.5 w-3.5" />}
            value={locationLabel || "Sin ubicación"}
            muted={!locationLabel}
          />
        </TableCell>
      )}

      {visibleColumns.operation && (
        <TableCell>
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <Wrench className="h-3.5 w-3.5 shrink-0 text-slate-400" />

              <p className="truncate text-sm font-medium text-slate-800">
                {maintenanceCount} mantenimiento
                {maintenanceCount === 1 ? "" : "s"}
              </p>
            </div>

            <p className="truncate text-xs font-medium text-slate-500">
              {installationCount} instalación
              {installationCount === 1 ? "" : "es"}
            </p>
          </div>
        </TableCell>
      )}

      {visibleColumns.activity && (
        <TableCell>
          <div className="min-w-0">
            <p
              title={lastActivity.main}
              className="truncate text-sm font-medium text-slate-800"
            >
              {lastActivity.main}
            </p>

            <p
              title={lastActivity.helper}
              className="mt-1 truncate text-xs font-medium text-slate-500"
            >
              {lastActivity.helper}
            </p>
          </div>
        </TableCell>
      )}

      {visibleColumns.status && (
        <TableCell align="center">
          <span
            className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${getClientStatusBadgeClass(
              status,
            )}`}
          >
            {getClientStatusLabel(status)}
          </span>
        </TableCell>
      )}
    </li>
  );
}
