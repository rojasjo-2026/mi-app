"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  normalizeClientStatus,
  getClientStatusLabel,
  type ClientStatus,
} from "@/lib/clients/clientStatus";
import {
  getClientFullName,
  getLocationLabel,
  formatDateLabel,
} from "@/lib/clients/clientList.utils";
import { ClientListToast } from "@/components/clients/list/ClientListToast";
import { ClientListLoadingState } from "@/components/clients/list/ClientListLoadingState";
import { ClientListErrorState } from "@/components/clients/list/ClientListErrorState";
import { ClientListFilters } from "@/components/clients/list/ClientListFilters";
import { ClientListCard } from "@/components/clients/list/ClientListCard";
import { ClientListEmptyState } from "@/components/clients/list/ClientListEmptyState";

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

type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type ClientMetrics = {
  total: number;
  active: number;
  withWhatsApp: number;
  attention: number;
};

type StatusFilter = "all" | ClientStatus;
type WhatsAppFilter = "all" | "with" | "without";
type SortType = "name" | "recent";
type SortKey =
  | "client"
  | "contact"
  | "location"
  | "operation"
  | "activity"
  | "status";
type SortDirection = "asc" | "desc";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

type ClientMetricCardProps = {
  title: string;
  value: string | number;
  detail: string;
  icon: string;
  accentClass: string;
  bgClass: string;
};

const DEFAULT_COLUMN_WIDTHS = {
  client: 330,
  contact: 280,
  location: 250,
  operation: 185,
  activity: 185,
  status: 125,
};

const MIN_COLUMN_WIDTHS: Record<keyof typeof DEFAULT_COLUMN_WIDTHS, number> = {
  client: 300,
  contact: 230,
  location: 210,
  operation: 165,
  activity: 165,
  status: 115,
};

type ClientTableColumnKey = keyof typeof DEFAULT_COLUMN_WIDTHS;
type ToggleableColumnKey = Exclude<ClientTableColumnKey, "client">;

const OPTIONAL_COLUMNS: { key: ToggleableColumnKey; label: string }[] = [
  { key: "contact", label: "Contacto" },
  { key: "location", label: "Ubicación" },
  { key: "operation", label: "Operación" },
  { key: "activity", label: "Actividad" },
  { key: "status", label: "Estado" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function ClientMetricCard({
  title,
  value,
  detail,
  icon,
  accentClass,
  bgClass,
}: ClientMetricCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${bgClass} text-lg`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-600">
            {title}
          </p>
          <div className="mt-1 flex items-end gap-2">
            <p className={`text-2xl font-black leading-none ${accentClass}`}>
              {value}
            </p>
            <span className="pb-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Clientes
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-1 text-sm font-medium text-slate-500">
        {detail}
      </p>
    </article>
  );
}

function getWhatsAppWebUrl(phone?: string | null) {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `https://wa.me/${digits}`;
}

function DetailField({
  label,
  value,
  children,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}) {
  const displayValue = children ?? value ?? "-";
  const valueTitle =
    typeof displayValue === "string" || typeof displayValue === "number"
      ? String(displayValue)
      : undefined;

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p
        title={label}
        className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-slate-400"
      >
        {label}
      </p>

      <div
        title={valueTitle}
        className="mt-1 min-w-0 truncate text-sm font-bold text-slate-800"
      >
        {displayValue}
      </div>
    </div>
  );
}

function ClientPreviewPanel({
  client,
  onToggleStatus,
}: {
  client: Client | null;
  onToggleStatus: (client: Client) => void | Promise<void>;
}) {
  if (!client) {
    return (
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-bold text-slate-800">Resumen del cliente</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Selecciona un cliente de la tabla para ver su información y acciones
          rápidas.
        </p>
      </aside>
    );
  }

  const fullName = getClientFullName(client);
  const location = getLocationLabel(client) || "Sin ubicación";
  const status = normalizeClientStatus(client.client_status) ?? "ACTIVE";
  const maintenanceCount =
    typeof client.maintenance_count === "number" ? client.maintenance_count : 0;
  const installationCount =
    typeof client.installation_count === "number"
      ? client.installation_count
      : 0;
  const lastActivity =
    formatDateLabel(client.last_contact) ||
    formatDateLabel(client.last_maintenance) ||
    "Sin registro";
  const whatsappUrl = getWhatsAppWebUrl(client.phone_primary);

  return (
    <aside className="sticky top-6 z-10 rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Resumen del cliente
        </p>

        <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
          {fullName}
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {getClientStatusLabel(status)}
          </span>

          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-bold",
              client.whatsapp_opt_in
                ? "bg-green-50 text-green-700"
                : "bg-slate-100 text-slate-500",
            ].join(" ")}
          >
            {client.whatsapp_opt_in ? "WhatsApp habilitado" : "Sin WhatsApp"}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <DetailField label="Teléfono" value={client.phone_primary || "-"} />
          <DetailField label="WhatsApp">
            {whatsappUrl && client.whatsapp_opt_in ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                title="Abrir chat en WhatsApp Web con este cliente"
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 transition hover:bg-green-100 hover:text-green-800"
              >
                Abrir WhatsApp
              </a>
            ) : (
              <span className="text-slate-500">No habilitado</span>
            )}
          </DetailField>
          <DetailField label="Ubicación" value={location} />
          <DetailField label="Última actividad" value={lastActivity} />
          <DetailField label="Instalaciones" value={installationCount} />
          <DetailField label="Mantenimientos" value={maintenanceCount} />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-950">Acciones rápidas</p>
          <p className="mt-1 text-xs font-medium leading-5 text-blue-700">
            Usa el panel para trabajar con el cliente seleccionado sin perder la
            lista.
          </p>
        </div>

        <div className="grid gap-2">
          <Link
            href={`/clients/${client.client_id}`}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Ver detalle completo
          </Link>

          <Link
            href={`/clients/${client.client_id}/edit`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Editar cliente
          </Link>

          <Link
            href={`/installations/new?client_id=${client.client_id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Crear instalación
          </Link>

          <button
            type="button"
            onClick={() => void onToggleStatus(client)}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {status === "INACTIVE" ? "Activar cliente" : "Desactivar cliente"}
          </button>
        </div>
      </div>
    </aside>
  );
}

type ResizableHeaderCellProps = {
  label: string;
  columnKey: ClientTableColumnKey;
  onResizeStart: (
    event: React.MouseEvent<HTMLSpanElement>,
    columnKey: ClientTableColumnKey,
  ) => void;
  align?: "left" | "center" | "right";
  resizable?: boolean;
  sortKey?: SortKey;
  activeSortKey: SortKey;
  sortDirection: SortDirection;
  onSort?: (sortKey: SortKey) => void;
  sticky?: "left";
};

function ResizableHeaderCell({
  label,
  columnKey,
  onResizeStart,
  align = "left",
  resizable = true,
  sortKey,
  activeSortKey,
  sortDirection,
  onSort,
  sticky,
}: ResizableHeaderCellProps) {
  const alignmentClass =
    align === "right"
      ? "justify-end text-right"
      : align === "center"
        ? "justify-center text-center"
        : "justify-start text-left";

  const stickyClass =
    sticky === "left"
      ? "sticky left-0 z-30 border-r border-slate-200 bg-slate-50 shadow-[10px_0_18px_-18px_rgba(15,23,42,0.45)]"
      : "";

  const isSortable = Boolean(sortKey && onSort);
  const isActiveSort = sortKey === activeSortKey;
  const sortIndicator = isActiveSort
    ? sortDirection === "asc"
      ? "↑"
      : "↓"
    : "↕";

  return (
    <div
      className={[
        "relative flex min-w-0 items-center border-l border-slate-200 px-4 py-3 first:border-l-0",
        alignmentClass,
        stickyClass,
      ].join(" ")}
    >
      <button
        type="button"
        disabled={!isSortable}
        aria-sort={
          isActiveSort
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        title={isSortable ? `Ordenar por ${label}` : undefined}
        onClick={() => {
          if (sortKey && onSort) {
            onSort(sortKey);
          }
        }}
        className={[
          "flex min-w-0 items-center gap-2 truncate text-xs font-black uppercase tracking-[0.14em]",
          isActiveSort ? "text-slate-700" : "text-slate-400",
          isSortable
            ? "cursor-pointer transition hover:text-slate-700"
            : "cursor-default",
        ].join(" ")}
      >
        <span className="truncate">{label}</span>
        {isSortable && (
          <span
            className={[
              "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none",
              isActiveSort
                ? "bg-blue-50 text-blue-700"
                : "bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            {sortIndicator}
          </span>
        )}
      </button>

      {resizable && (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label={`Cambiar ancho de columna ${label}`}
          onMouseDown={(event) => onResizeStart(event, columnKey)}
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none transition hover:bg-blue-300/50"
        />
      )}
    </div>
  );
}

type ColumnPickerProps = {
  isOpen: boolean;
  visibleColumns: Record<ToggleableColumnKey, boolean>;
  onToggleColumn: (columnKey: ToggleableColumnKey) => void;
};

function ColumnPicker({
  isOpen,
  visibleColumns,
  onToggleColumn,
}: ColumnPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      <div className="px-3 py-2">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          Columnas visibles
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Cliente siempre permanece visible.
        </p>
      </div>

      <div className="space-y-1">
        {OPTIONAL_COLUMNS.map((column) => (
          <label
            key={column.key}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={visibleColumns[column.key]}
              onChange={() => onToggleColumn(column.key)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {column.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [whatsFilter, setWhatsFilter] = useState<WhatsAppFilter>("all");
  const [sort, setSort] = useState<SortType>("name");
  const [sortKey, setSortKey] = useState<SortKey>("client");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
  });
  const [metrics, setMetrics] = useState<ClientMetrics>({
    total: 0,
    active: 0,
    withWhatsApp: 0,
    attention: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const [columnWidths, setColumnWidths] = useState(DEFAULT_COLUMN_WIDTHS);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<
    Record<ToggleableColumnKey, boolean>
  >({
    contact: true,
    location: true,
    operation: false,
    activity: false,
    status: true,
  });

  const columnPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        columnPickerRef.current &&
        !columnPickerRef.current.contains(event.target as Node)
      ) {
        setIsColumnPickerOpen(false);
      }
    }

    if (isColumnPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColumnPickerOpen]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadClients() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        params.set("page", String(currentPage));
        params.set("pageSize", String(pageSize));
        params.set("sortKey", sortKey);
        params.set("sortDirection", sortDirection);

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        if (whatsFilter !== "all") {
          params.set("whatsapp", whatsFilter);
        }

        const res = await fetch(`/api/clients?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error("Error loading clients");
        }

        const nextClients: Client[] = Array.isArray(result.data)
          ? result.data
          : [];

        const nextPagination: PaginationState = result.pagination ?? {
          page: currentPage,
          pageSize,
          totalItems: nextClients.length,
          totalPages: 1,
        };

        setClients(nextClients);
        setPagination(nextPagination);
        setMetrics({
          total: Number(
            result.metrics?.total ?? nextPagination.totalItems ?? 0,
          ),
          active: Number(result.metrics?.active ?? 0),
          withWhatsApp: Number(result.metrics?.withWhatsApp ?? 0),
          attention: Number(result.metrics?.attention ?? 0),
        });

        setSelectedClientId((currentSelectedId) => {
          if (
            currentSelectedId &&
            nextClients.some((client) => client.client_id === currentSelectedId)
          ) {
            return currentSelectedId;
          }

          return nextClients[0]?.client_id ?? null;
        });

        if (
          nextPagination.totalPages > 0 &&
          currentPage > nextPagination.totalPages
        ) {
          setCurrentPage(nextPagination.totalPages);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError("No se pudieron cargar los clientes");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadClients();

    return () => controller.abort();
  }, [
    currentPage,
    pageSize,
    search,
    statusFilter,
    whatsFilter,
    sortKey,
    sortDirection,
  ]);

  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    whatsFilter,
    sort,
    sortKey,
    sortDirection,
    pageSize,
  ]);

  const activeColumnKeys = useMemo<ClientTableColumnKey[]>(
    () => [
      "client",
      ...OPTIONAL_COLUMNS.filter((column) => visibleColumns[column.key]).map(
        (column) => column.key,
      ),
    ],
    [visibleColumns],
  );

  const gridTemplateColumns = useMemo(
    () =>
      activeColumnKeys
        .map((columnKey) => {
          const width = columnWidths[columnKey];

          if (columnKey === "client") {
            return `${width}px`;
          }

          return `minmax(${width}px, 1fr)`;
        })
        .join(" "),
    [activeColumnKeys, columnWidths],
  );

  const tableWidth = useMemo(
    () =>
      activeColumnKeys.reduce(
        (totalWidth, columnKey) => totalWidth + columnWidths[columnKey],
        0,
      ),
    [activeColumnKeys, columnWidths],
  );

  const selectedClient = useMemo(
    () =>
      clients.find((client) => client.client_id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  function startColumnResize(
    event: React.MouseEvent<HTMLSpanElement>,
    columnKey: ClientTableColumnKey,
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (columnKey === "client") return;

    const startX = event.clientX;
    const startWidth = columnWidths[columnKey];

    function handleMouseMove(moveEvent: MouseEvent) {
      const nextWidth = Math.max(
        MIN_COLUMN_WIDTHS[columnKey],
        startWidth + moveEvent.clientX - startX,
      );

      setColumnWidths((currentWidths) => ({
        ...currentWidths,
        [columnKey]: nextWidth,
      }));
    }

    function handleMouseUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function toggleColumn(columnKey: ToggleableColumnKey) {
    setVisibleColumns((currentColumns) => ({
      ...currentColumns,
      [columnKey]: !currentColumns[columnKey],
    }));
  }

  function handleHeaderSort(nextSortKey: SortKey) {
    setSortKey((currentSortKey) => {
      if (currentSortKey === nextSortKey) {
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        );
        return currentSortKey;
      }

      setSortDirection(nextSortKey === "activity" ? "desc" : "asc");
      return nextSortKey;
    });
  }

  function handleSortSelectChange(value: SortType) {
    setSort(value);

    if (value === "recent") {
      setSortKey("activity");
      setSortDirection("desc");
      return;
    }

    setSortKey("client");
    setSortDirection("asc");
  }

  const visibleTotal = pagination.totalItems;
  const totalPages = Math.max(1, pagination.totalPages);
  const safeCurrentPage = Math.min(pagination.page || currentPage, totalPages);
  const pageStartIndex =
    visibleTotal === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEndIndex = Math.min(safeCurrentPage * pageSize, visibleTotal);

  async function toggleStatus(client: Client) {
    const currentStatus = normalizeClientStatus(client.client_status);
    const newStatus: ClientStatus =
      currentStatus === "INACTIVE" ? "ACTIVE" : "INACTIVE";

    try {
      const res = await fetch(`/api/clients/${client.client_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_status: newStatus }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error("No se pudo actualizar el estado");
      }

      setClients((prev) =>
        prev.map((c) =>
          c.client_id === client.client_id
            ? { ...c, client_status: newStatus }
            : c,
        ),
      );

      setToast({
        type: "success",
        message:
          newStatus === "INACTIVE" ? "Cliente desactivado" : "Cliente activado",
      });
    } catch {
      setToast({
        type: "error",
        message: "No se pudo actualizar el estado del cliente",
      });
    }
  }

  if (loading && clients.length === 0) {
    return <ClientListLoadingState />;
  }

  if (error) {
    return <ClientListErrorState message={error} />;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-8">
      <ClientListToast toast={toast} />

      <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Clientes
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Gestión de clientes
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Administra clientes, contactos, ubicaciones, WhatsApp y actividad
              operativa desde una sola pantalla.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            <Link
              href="/clients/new"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Nuevo cliente
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientMetricCard
            title="Clientes visibles"
            value={metrics.total}
            detail="Total con filtros actuales desde el servidor"
            icon="👥"
            accentClass="text-slate-950"
            bgClass="bg-slate-100"
          />

          <ClientMetricCard
            title="Clientes activos"
            value={metrics.active}
            detail="Activos dentro de los filtros actuales"
            icon="✅"
            accentClass="text-emerald-600"
            bgClass="bg-emerald-50"
          />

          <ClientMetricCard
            title="Con WhatsApp"
            value={metrics.withWhatsApp}
            detail="Habilitados dentro de los filtros actuales"
            icon="💬"
            accentClass="text-blue-600"
            bgClass="bg-blue-50"
          />

          <ClientMetricCard
            title="Requieren atención"
            value={metrics.attention}
            detail="En espera o inactivos dentro de los filtros"
            icon="⚠️"
            accentClass="text-orange-600"
            bgClass="bg-orange-50"
          />
        </div>

        <ClientListFilters
          search={search}
          statusFilter={statusFilter}
          whatsFilter={whatsFilter}
          sort={sort}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onWhatsFilterChange={setWhatsFilter}
          onSortChange={handleSortSelectChange}
        />

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Controles de tabla
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Ajusta columnas visibles y cantidad de registros por página.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div ref={columnPickerRef} className="relative">
              <button
                type="button"
                onClick={() => setIsColumnPickerOpen((current) => !current)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Columnas
              </button>

              <ColumnPicker
                isOpen={isColumnPickerOpen}
                visibleColumns={visibleColumns}
                onToggleColumn={toggleColumn}
              />
            </div>

            <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
              Ver
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-sm font-bold outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">
              Mostrando {pageStartIndex}-{pageEndIndex} de {visibleTotal}{" "}
              resultado{visibleTotal === 1 ? "" : "s"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Selecciona una fila para ver el resumen y acciones en el panel
              derecho.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {loading && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                Actualizando...
              </span>
            )}

            {statusFilter !== "all" && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                Estado: {getClientStatusLabel(statusFilter)}
              </span>
            )}

            {whatsFilter !== "all" && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                WhatsApp:{" "}
                {whatsFilter === "with" ? "Con WhatsApp" : "Sin WhatsApp"}
              </span>
            )}

            {search.trim() && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                Búsqueda activa
              </span>
            )}
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          {clients.length === 0 ? (
            <ClientListEmptyState />
          ) : (
            <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <div
                  style={{
                    minWidth: tableWidth,
                    width: "100%",
                  }}
                >
                  <div
                    style={{ gridTemplateColumns }}
                    className="grid border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    <ResizableHeaderCell
                      label="Cliente"
                      columnKey="client"
                      activeSortKey={sortKey}
                      sortDirection={sortDirection}
                      sortKey="client"
                      resizable={false}
                      sticky="left"
                      onSort={handleHeaderSort}
                      onResizeStart={startColumnResize}
                    />

                    {visibleColumns.contact && (
                      <ResizableHeaderCell
                        label="Contacto"
                        columnKey="contact"
                        activeSortKey={sortKey}
                        sortDirection={sortDirection}
                        sortKey="contact"
                        onSort={handleHeaderSort}
                        onResizeStart={startColumnResize}
                      />
                    )}

                    {visibleColumns.location && (
                      <ResizableHeaderCell
                        label="Ubicación"
                        columnKey="location"
                        activeSortKey={sortKey}
                        sortDirection={sortDirection}
                        sortKey="location"
                        onSort={handleHeaderSort}
                        onResizeStart={startColumnResize}
                      />
                    )}

                    {visibleColumns.operation && (
                      <ResizableHeaderCell
                        label="Operación"
                        columnKey="operation"
                        activeSortKey={sortKey}
                        sortDirection={sortDirection}
                        sortKey="operation"
                        onSort={handleHeaderSort}
                        onResizeStart={startColumnResize}
                      />
                    )}

                    {visibleColumns.activity && (
                      <ResizableHeaderCell
                        label="Última act."
                        columnKey="activity"
                        activeSortKey={sortKey}
                        sortDirection={sortDirection}
                        sortKey="activity"
                        onSort={handleHeaderSort}
                        onResizeStart={startColumnResize}
                      />
                    )}

                    {visibleColumns.status && (
                      <ResizableHeaderCell
                        label="Estado"
                        columnKey="status"
                        align="center"
                        activeSortKey={sortKey}
                        sortDirection={sortDirection}
                        sortKey="status"
                        onSort={handleHeaderSort}
                        onResizeStart={startColumnResize}
                      />
                    )}
                  </div>

                  <ul>
                    {clients.map((client) => (
                      <ClientListCard
                        key={client.client_id}
                        client={client}
                        isSelected={client.client_id === selectedClientId}
                        onSelect={() => setSelectedClientId(client.client_id)}
                        gridTemplateColumns={gridTemplateColumns}
                        visibleColumns={visibleColumns}
                      />
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Página {safeCurrentPage} de {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={safeCurrentPage <= 1 || loading}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={safeCurrentPage >= totalPages || loading}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}

          <ClientPreviewPanel
            client={selectedClient}
            onToggleStatus={toggleStatus}
          />
        </div>
      </section>
    </main>
  );
}
