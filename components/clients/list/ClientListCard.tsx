"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Mail, MapPin, MoreVertical, Phone, Wrench } from "lucide-react";
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
  onToggleStatus: (client: Client) => void | Promise<void>;
  gridTemplateColumns: string;
  visibleColumns: VisibleClientColumns;
};

type MenuPosition = {
  top: number;
  left: number;
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
          "truncate text-sm font-semibold",
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
}: {
  children: ReactNode;
  align?: "left" | "center" | "right";
  sticky?: "left" | "right";
}) {
  const alignClass =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
        ? "justify-center text-center"
        : "justify-start text-left";

  const stickyClass =
    sticky === "left"
      ? "sticky left-0 z-20 border-r border-slate-200 bg-white shadow-[10px_0_18px_-18px_rgba(15,23,42,0.45)] group-hover:bg-slate-50"
      : sticky === "right"
        ? "sticky right-0 z-20 border-l border-slate-200 bg-white shadow-[-10px_0_18px_-18px_rgba(15,23,42,0.45)] group-hover:bg-slate-50"
        : "";

  return (
    <div
      className={[
        "flex min-w-0 items-center border-l border-slate-100 px-4 py-3 first:border-l-0",
        alignClass,
        stickyClass,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function ClientListCard({
  client,
  onToggleStatus,
  gridTemplateColumns,
  visibleColumns,
}: ClientListCardProps) {
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
  const isMenuOpen = Boolean(menuPosition);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function closeMenu() {
    setMenuPosition(null);
  }

  function openMenuFromButton() {
    const button = menuButtonRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 96;
    const gap = 8;
    const margin = 12;

    const left = Math.min(
      Math.max(margin, rect.right - menuWidth),
      window.innerWidth - menuWidth - margin,
    );

    const shouldOpenUp = rect.bottom + gap + menuHeight > window.innerHeight;
    const top = shouldOpenUp
      ? Math.max(margin, rect.top - menuHeight - gap)
      : rect.bottom + gap;

    setMenuPosition({ top, left });
  }

  function toggleMenu(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (isMenuOpen) {
      closeMenu();
      return;
    }

    openMenuFromButton();
  }

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleMouseDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        menuRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return;
      }

      closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [isMenuOpen]);

  const actionsMenu =
    isMounted && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
            className="fixed z-[2147483647] w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <Link
              href={`/clients/${client.client_id}/edit`}
              role="menuitem"
              onClick={closeMenu}
              className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Editar
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenu();
                void onToggleStatus(client);
              }}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              {status === "INACTIVE" ? "Activar" : "Desactivar"}
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <li
      style={{ gridTemplateColumns }}
      className="group grid min-h-[72px] border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50"
    >
      <TableCell sticky="left">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href={`/clients/${client.client_id}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700 transition hover:bg-blue-600 hover:text-white"
            aria-label={`Ver detalle de ${fullName}`}
          >
            {initials}
          </Link>

          <div className="min-w-0">
            <Link href={`/clients/${client.client_id}`} className="block">
              <h2
                title={fullName}
                className="truncate text-base font-black tracking-tight text-slate-950 transition hover:text-blue-700"
              >
                {fullName}
              </h2>
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                Cliente
              </span>

              {client.whatsapp_opt_in && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  WhatsApp
                </span>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      {visibleColumns.contact && (
        <TableCell>
          <div className="min-w-0 space-y-1.5">
            <ClientMetaItem
              icon={<Phone className="h-4 w-4" />}
              value={client.phone_primary || "Sin teléfono"}
              muted={!client.phone_primary}
            />

            <ClientMetaItem
              icon={<Mail className="h-4 w-4" />}
              value={client.email || "Sin email"}
              muted={!client.email}
            />
          </div>
        </TableCell>
      )}

      {visibleColumns.location && (
        <TableCell>
          <ClientMetaItem
            icon={<MapPin className="h-4 w-4" />}
            value={locationLabel || "Sin ubicación"}
            muted={!locationLabel}
          />
        </TableCell>
      )}

      {visibleColumns.operation && (
        <TableCell>
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 items-center gap-2">
              <Wrench className="h-4 w-4 shrink-0 text-slate-400" />

              <p className="truncate text-sm font-bold text-slate-800">
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
              className="truncate text-sm font-bold text-slate-800"
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
            className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getClientStatusBadgeClass(
              status,
            )}`}
          >
            {getClientStatusLabel(status)}
          </span>
        </TableCell>
      )}

      <TableCell align="right" sticky="right">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/clients/${client.client_id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Ver detalle
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleMenu}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label={`Abrir acciones de ${fullName}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {actionsMenu}
        </div>
      </TableCell>
    </li>
  );
}
