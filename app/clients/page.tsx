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
import {
  DEFAULT_COLUMN_WIDTHS,
  MIN_COLUMN_WIDTHS,
  OPTIONAL_COLUMNS,
  PAGE_SIZE_OPTIONS,
  type Client,
  type ClientMetrics,
  type ClientTableColumnKey,
  type PaginationState,
  type SortDirection,
  type SortKey,
  type SortType,
  type StatusFilter,
  type ToastState,
  type ToggleableColumnKey,
  type WhatsAppFilter,
} from "./config/clientsPageConfig";
import { getWhatsAppWebUrl } from "./utils/clientsPageUtils";
import { ClientMetricCard } from "./components/ClientMetricCard";
import { ClientPreviewPanel } from "./components/ClientPreviewPanel";
import { ResizableHeaderCell } from "./components/ResizableHeaderCell";
import { ColumnPicker } from "./components/ColumnPicker";

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

