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
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import {
  COLUMN_LABELS,
  INITIAL_COLUMN_WIDTHS,
  INITIAL_VISIBLE_COLUMNS,
  MIN_COLUMN_WIDTHS,
  OPTIONAL_COLUMNS,
  PAGE_SIZE_OPTIONS,
  STATUS_FILTERS,
  type AppSettingsResponse,
  type ColumnKey,
  type ColumnWidths,
  type FilterType,
  type InstallationItem,
  type InstallationMetrics,
  type OptionalColumnKey,
  type PaginationState,
  type SortDirection,
  type SortKey,
  type SortType,
  type VisibleColumns,
} from "./config/installationsPageConfig";
import {
  formatCurrency,
  formatDateLabel,
  getBusinessCountryMeta,
  getClientName,
  getFilterButtonClass,
  getInitials,
  getInstallationCode,
  getInstallationStatusLabel,
  getLocationLabel,
  getStatusBadgeClass,
} from "./utils/installationsPageUtils";
import { TableHeaderCell } from "./components/TableHeaderCell";
import { TableBodyCell } from "./components/TableBodyCell";
import { InstallationPreviewPanel } from "./components/InstallationPreviewPanel";

export default function InstallationsPage() {
  const [installations, setInstallations] = useState<InstallationItem[]>([]);
  const [selectedInstallationId, setSelectedInstallationId] = useState<
    string | null
  >(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
  });
  const [metrics, setMetrics] = useState<InstallationMetrics>({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    cancelled: 0,
  });
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(
    INITIAL_COLUMN_WIDTHS,
  );
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(
    INITIAL_VISIBLE_COLUMNS,
  );
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  const defaultBusinessMeta = useMemo(() => getBusinessCountryMeta(), []);
  const [businessCurrency, setBusinessCurrency] = useState(
    defaultBusinessMeta.currency,
  );
  const [businessLocale, setBusinessLocale] = useState(
    defaultBusinessMeta.locale,
  );

  const displayedColumns = useMemo<ColumnKey[]>(() => {
    const middleColumns = OPTIONAL_COLUMNS.filter(
      (column) => visibleColumns[column.key],
    ).map((column) => column.key);

    return ["installation", ...middleColumns, "actions"];
  }, [visibleColumns]);

  const gridTemplateColumns = useMemo(
    () =>
      displayedColumns.map((column) => `${columnWidths[column]}px`).join(" "),
    [displayedColumns, columnWidths],
  );

  const tableMinWidth = useMemo(
    () =>
      displayedColumns.reduce(
        (total, column) => total + columnWidths[column],
        0,
      ),
    [displayedColumns, columnWidths],
  );

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!isColumnMenuOpen) return;

      const target = event.target;

      if (
        target instanceof Node &&
        columnMenuRef.current &&
        !columnMenuRef.current.contains(target)
      ) {
        setIsColumnMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isColumnMenuOpen]);

  useEffect(() => {
    async function loadBusinessSettings() {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
        });

        const result: AppSettingsResponse = await response.json();

        if (!response.ok || !result.success) {
          return;
        }

        const businessMeta = getBusinessCountryMeta(result.data);

        setBusinessCurrency(businessMeta.currency);
        setBusinessLocale(businessMeta.locale);
      } catch {
        // Keep default business metadata if settings cannot be loaded.
      }
    }

    async function loadInstallations() {
      try {
        await loadBusinessSettings();

        const params = new URLSearchParams();

        params.set("page", String(currentPage));
        params.set("pageSize", String(pageSize));
        params.set("sortKey", sortKey);
        params.set("sortDirection", sortDirection);

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (filter !== "all") {
          params.set("status", filter);
        }

        const response = await fetch(
          `/api/installations?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "No se pudieron cargar las instalaciones",
          );
        }

        const nextInstallations: InstallationItem[] = Array.isArray(result.data)
          ? result.data
          : [];

        const nextPagination: PaginationState = result.pagination ?? {
          page: currentPage,
          pageSize,
          totalItems: nextInstallations.length,
          totalPages: 1,
        };

        setInstallations(nextInstallations);
        setPagination(nextPagination);
        setMetrics({
          total: Number(
            result.metrics?.total ?? nextPagination.totalItems ?? 0,
          ),
          open: Number(result.metrics?.open ?? 0),
          inProgress: Number(result.metrics?.inProgress ?? 0),
          closed: Number(result.metrics?.closed ?? 0),
          cancelled: Number(result.metrics?.cancelled ?? 0),
        });

        setSelectedInstallationId((currentSelectedId) => {
          if (
            currentSelectedId &&
            nextInstallations.some(
              (installation) =>
                installation.installation_id === currentSelectedId,
            )
          ) {
            return currentSelectedId;
          }

          return nextInstallations[0]?.installation_id ?? null;
        });

        if (
          nextPagination.totalPages > 0 &&
          currentPage > nextPagination.totalPages
        ) {
          setCurrentPage(nextPagination.totalPages);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las instalaciones",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInstallations();
  }, [currentPage, pageSize, search, filter, sortKey, sortDirection]);

  const filteredInstallations = installations;

  useEffect(() => {
    setSelectedInstallationId((currentSelectedId) => {
      if (
        currentSelectedId &&
        filteredInstallations.some(
          (installation) => installation.installation_id === currentSelectedId,
        )
      ) {
        return currentSelectedId;
      }

      return filteredInstallations[0]?.installation_id ?? null;
    });
  }, [filteredInstallations]);

  const selectedInstallation = useMemo(
    () =>
      filteredInstallations.find(
        (installation) =>
          installation.installation_id === selectedInstallationId,
      ) ?? null,
    [filteredInstallations, selectedInstallationId],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, sortKey, sortDirection, pageSize]);

  const visibleTotal = pagination.totalItems;
  const totalPages = Math.max(1, pagination.totalPages);
  const safeCurrentPage = Math.min(pagination.page || currentPage, totalPages);
  const pageStartIndex =
    visibleTotal === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEndIndex = Math.min(safeCurrentPage * pageSize, visibleTotal);

  function handleHeaderSort(nextSortKey: SortKey) {
    setSortKey((currentSortKey) => {
      if (currentSortKey === nextSortKey) {
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        );
        return currentSortKey;
      }

      setSortDirection(nextSortKey === "date" ? "desc" : "asc");
      return nextSortKey;
    });
  }

  function handleSortSelectChange(value: SortType) {
    setSortBy(value);
    setSortKey("date");
    setSortDirection(value === "oldest" ? "asc" : "desc");
  }

  function startColumnResize(
    event: ReactMouseEvent<HTMLSpanElement>,
    columnKey: ColumnKey,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = columnWidths[columnKey];
    const minWidth = MIN_COLUMN_WIDTHS[columnKey];

    function handleMouseMove(mouseEvent: MouseEvent) {
      const nextWidth = Math.max(
        minWidth,
        startWidth + mouseEvent.clientX - startX,
      );

      setColumnWidths((current) => ({
        ...current,
        [columnKey]: nextWidth,
      }));
    }

    function handleMouseUp() {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function toggleColumn(columnKey: OptionalColumnKey) {
    setVisibleColumns((current) => ({
      ...current,
      [columnKey]: !current[columnKey],
    }));
  }

  function getStatusFilterCount(statusValue: FilterType) {
    if (statusValue === "all") return metrics.total;
    if (statusValue === "OPEN") return metrics.open;
    if (statusValue === "IN_PROGRESS") return metrics.inProgress;
    if (statusValue === "CLOSED") return metrics.closed;
    if (statusValue === "CANCELLED") return metrics.cancelled;

    return 0;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-[1500px] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Cargando instalaciones...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-[1500px] rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-6 text-slate-900 md:p-8">
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Gestión de instalaciones
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Instalaciones
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Gestiona las instalaciones registradas y crea nuevas.
            </p>
          </div>

          <Link
            href="/installations/new"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nueva instalación
          </Link>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Buscar instalación
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por cliente, descripción, técnico, servicio o ubicación"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Estado de instalación
                </p>

                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((statusFilter) => (
                    <button
                      key={statusFilter.value}
                      type="button"
                      onClick={() => setFilter(statusFilter.value)}
                      className={getFilterButtonClass(
                        filter === statusFilter.value,
                      )}
                    >
                      {statusFilter.label}
                      <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-xs">
                        {getStatusFilterCount(statusFilter.value)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div ref={columnMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsColumnMenuOpen((current) => !current)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Columnas
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  {isColumnMenuOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Mostrar columnas
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                        Instalación y Acciones siempre permanecen visibles.
                      </div>

                      <div className="mt-2">
                        {OPTIONAL_COLUMNS.map((column) => (
                          <label
                            key={column.key}
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns[column.key]}
                              onChange={() => toggleColumn(column.key)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            {column.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-500">
                    Ordenar por
                  </span>

                  <select
                    value={sortBy}
                    onChange={(e) =>
                      handleSortSelectChange(e.target.value as SortType)
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-300"
                  >
                    <option value="recent">Más recientes</option>
                    <option value="oldest">Más antiguas</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-bold">
                {pageStartIndex}-{pageEndIndex}
              </span>{" "}
              de <span className="font-bold">{visibleTotal}</span> instalaciones
            </div>
          </div>
        </section>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          {filteredInstallations.length === 0 ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-base font-bold text-slate-800">
                No se encontraron instalaciones
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Prueba con otro filtro o registra una nueva instalación.
              </p>
            </section>
          ) : (
            <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <div style={{ minWidth: tableMinWidth }}>
                  <div
                    style={{ gridTemplateColumns }}
                    className="grid border-b border-slate-200 bg-slate-50"
                  >
                    {displayedColumns.map((column) => (
                      <TableHeaderCell
                        key={column}
                        columnKey={column}
                        label={COLUMN_LABELS[column]}
                        sortKey={column === "actions" ? undefined : column}
                        activeSortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleHeaderSort}
                        onResizeStart={startColumnResize}
                      />
                    ))}
                  </div>

                  <ul className="divide-y divide-slate-100">
                    {filteredInstallations.map((item, index) => {
                      const installationName =
                        item.description || "Instalación sin descripción";
                      const clientName = getClientName(item.client);
                      const installationCode = getInstallationCode(
                        item,
                        pageStartIndex + index - 1,
                      );
                      const isSelected =
                        item.installation_id === selectedInstallationId;

                      return (
                        <li
                          key={item.installation_id}
                          role="button"
                          tabIndex={0}
                          data-selected={isSelected ? "true" : "false"}
                          onClick={() =>
                            setSelectedInstallationId(item.installation_id)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedInstallationId(item.installation_id);
                            }
                          }}
                          style={{ gridTemplateColumns }}
                          className={[
                            "group grid min-h-[82px] cursor-pointer transition hover:bg-blue-50/70",
                            isSelected
                              ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                              : "bg-white",
                          ].join(" ")}
                        >
                          {displayedColumns.includes("installation") && (
                            <TableBodyCell columnKey="installation">
                              <div className="flex min-w-0 items-center gap-4">
                                <div
                                  className={[
                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black transition",
                                    isSelected
                                      ? "bg-blue-600 text-white"
                                      : "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
                                  ].join(" ")}
                                >
                                  {getInitials(installationName)}
                                </div>

                                <div className="min-w-0">
                                  <Link
                                    href={`/installations/${item.installation_id}`}
                                    className="block"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <h2
                                      title={installationName}
                                      className="truncate text-sm font-black text-slate-950 transition hover:text-blue-700"
                                    >
                                      {installationName}
                                    </h2>
                                  </Link>

                                  <p
                                    title={installationCode}
                                    className="mt-1 truncate text-xs font-medium text-slate-500"
                                  >
                                    {installationCode}
                                  </p>
                                </div>
                              </div>
                            </TableBodyCell>
                          )}

                          {displayedColumns.includes("client") && (
                            <TableBodyCell columnKey="client">
                              <div className="min-w-0">
                                <p
                                  title={clientName}
                                  className="truncate text-sm font-bold text-slate-800"
                                >
                                  {clientName}
                                </p>

                                <p
                                  title={
                                    item.client?.phone_primary || "Sin teléfono"
                                  }
                                  className="mt-1 truncate text-xs text-slate-500"
                                >
                                  {item.client?.phone_primary || "Sin teléfono"}
                                </p>
                              </div>
                            </TableBodyCell>
                          )}

                          {displayedColumns.includes("service") && (
                            <TableBodyCell columnKey="service">
                              <span
                                title={
                                  item.service_type?.name || "Sin servicio"
                                }
                                className="truncate text-sm font-semibold text-slate-700"
                              >
                                {item.service_type?.name || "Sin servicio"}
                              </span>
                            </TableBodyCell>
                          )}

                          {displayedColumns.includes("date") && (
                            <TableBodyCell columnKey="date">
                              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
                                <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                                <span
                                  title={formatDateLabel(
                                    item.installation_date,
                                    businessLocale,
                                  )}
                                  className="truncate"
                                >
                                  {formatDateLabel(
                                    item.installation_date,
                                    businessLocale,
                                  )}
                                </span>
                              </div>
                            </TableBodyCell>
                          )}

                          {displayedColumns.includes("technician") && (
                            <TableBodyCell columnKey="technician">
                              <div className="flex min-w-0 items-center gap-2">
                                <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                                <span
                                  title={
                                    item.technician_name ||
                                    "Técnico no asignado"
                                  }
                                  className="truncate text-sm font-semibold text-slate-700"
                                >
                                  {item.technician_name ||
                                    "Técnico no asignado"}
                                </span>
                              </div>
                            </TableBodyCell>
                          )}

                          {displayedColumns.includes("location") && (
                            <TableBodyCell columnKey="location">
                              <div className="flex min-w-0 items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                                <span
                                  title={getLocationLabel(item)}
                                  className="truncate text-sm font-semibold text-slate-700"
                                >
                                  {getLocationLabel(item)}
                                </span>
                              </div>
                            </TableBodyCell>
                          )}

                          {displayedColumns.includes("amount") && (
                            <TableBodyCell columnKey="amount">
                              <span
                                title={formatCurrency(
                                  item.estimated_amount,
                                  businessCurrency,
                                  businessLocale,
                                )}
                                className="truncate text-sm font-bold text-slate-800"
                              >
                                {formatCurrency(
                                  item.estimated_amount,
                                  businessCurrency,
                                  businessLocale,
                                )}
                              </span>
                            </TableBodyCell>
                          )}

                          {displayedColumns.includes("status") && (
                            <TableBodyCell columnKey="status">
                              <span
                                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                                  item.installation_status,
                                )}`}
                              >
                                {getInstallationStatusLabel(
                                  item.installation_status,
                                )}
                              </span>
                            </TableBodyCell>
                          )}

                          {displayedColumns.includes("actions") && (
                            <TableBodyCell
                              columnKey="actions"
                              className="justify-end"
                            >
                              <div className="flex items-center justify-end gap-3">
                                <Link
                                  href={`/installations/${item.installation_id}`}
                                  onClick={(event) => event.stopPropagation()}
                                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                                >
                                  Ver detalle
                                </Link>
                              </div>
                            </TableBodyCell>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Página {safeCurrentPage} de {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
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
            </section>
          )}

          <InstallationPreviewPanel
            installation={selectedInstallation}
            businessCurrency={businessCurrency}
            businessLocale={businessLocale}
          />
        </div>
      </div>
    </main>
  );
}

