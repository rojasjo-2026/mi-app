"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  normalizeClientStatus,
  type ClientStatus,
} from "@/lib/clients/clientStatus";
import { ClientListToast } from "@/components/clients/list/ClientListToast";
import { ClientListLoadingState } from "@/components/clients/list/ClientListLoadingState";
import { ClientListErrorState } from "@/components/clients/list/ClientListErrorState";
import { ClientListFilters } from "@/components/clients/list/ClientListFilters";
import { ClientListCard } from "@/components/clients/list/ClientListCard";
import { ClientListEmptyState } from "@/components/clients/list/ClientListEmptyState";
import {
  DEFAULT_COLUMN_WIDTHS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_VISIBLE_COLUMNS,
  MIN_COLUMN_WIDTHS,
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
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
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
  >(DEFAULT_VISIBLE_COLUMNS);

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

  const activeColumnKeys = useMemo<ClientTableColumnKey[]>(() => {
    const columns: ClientTableColumnKey[] = ["client"];

    if (visibleColumns.contact) columns.push("contact");
    if (visibleColumns.location) columns.push("location");
    if (visibleColumns.operation) columns.push("operation");
    if (visibleColumns.activity) columns.push("activity");
    if (visibleColumns.status) columns.push("status");

    return columns;
  }, [visibleColumns]);

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
    event: ReactMouseEvent<HTMLSpanElement>,
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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <ClientListToast toast={toast} />

      <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Clientes
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Administra tus clientes, contactos, ubicaciones y actividad
              operativa.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            <Link
              href="/clients/new"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Nuevo cliente
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ClientMetricCard
            title="Clientes totales"
            value={metrics.total}
            detail="Todos los registros"
            icon="👥"
            accentClass="text-slate-950"
            bgClass="bg-blue-50"
          />

          <ClientMetricCard
            title="Clientes activos"
            value={metrics.active}
            detail="Activos y trabajando"
            icon="✅"
            accentClass="text-slate-950"
            bgClass="bg-emerald-50"
          />

          <ClientMetricCard
            title="Con WhatsApp"
            value={metrics.withWhatsApp}
            detail="Habilitados para contacto"
            icon="💬"
            accentClass="text-slate-950"
            bgClass="bg-violet-50"
          />

          <ClientMetricCard
            title="Requieren atención"
            value={metrics.attention}
            detail="En espera o inactivos"
            icon="⚠️"
            accentClass="text-slate-950"
            bgClass="bg-orange-50"
          />
        </div>

        <ClientListFilters
          search={search}
          statusFilter={statusFilter}
          whatsFilter={whatsFilter}
          sort={sort}
          resultText={`${visibleTotal} resultado${visibleTotal === 1 ? "" : "s"}`}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onWhatsFilterChange={setWhatsFilter}
          onSortChange={handleSortSelectChange}
          rightContent={
            <>
              <div ref={columnPickerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsColumnPickerOpen((current) => !current)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Columnas
                </button>

                <ColumnPicker
                  isOpen={isColumnPickerOpen}
                  visibleColumns={visibleColumns}
                  onToggleColumn={toggleColumn}
                />
              </div>

              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} por página
                  </option>
                ))}
              </select>
            </>
          }
        />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          {clients.length === 0 ? (
            <ClientListEmptyState />
          ) : (
            <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <div
                  style={{
                    minWidth: tableWidth,
                    width: "100%",
                  }}
                >
                  <div
                    style={{ gridTemplateColumns }}
                    className="grid border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400"
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

              <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Página {safeCurrentPage} de {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={safeCurrentPage <= 1 || loading}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={safeCurrentPage >= totalPages || loading}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
