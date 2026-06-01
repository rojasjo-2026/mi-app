"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Phone,
  Search,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  COLUMN_LABELS,
  INITIAL_COLUMN_WIDTHS,
  INITIAL_VISIBLE_COLUMNS,
  MIN_COLUMN_WIDTHS,
  OPTIONAL_COLUMNS,
  PAGE_SIZE_OPTIONS,
} from "./constants/followUpsPageConstants";
import type {
  AppSettingsResponse,
  BillingFilter,
  ColumnKey,
  ColumnWidths,
  FollowUp,
  FollowUpFilter,
  FollowUpMetrics,
  OptionalColumnKey,
  PaginationState,
  PriorityFilter,
  SortDirection,
  SortKey,
  Technician,
  TimingFilter,
  VisibleColumns,
} from "./types/followUpsPageTypes";
import {
  compareNumber,
  compareText,
  formatDateLabel,
  formatMaintenanceType,
  formatMoney,
  getBillingStatusClasses,
  getBillingStatusLabel,
  getBusinessCountryMeta,
  getClientName,
  getDateTimeForSort,
  getFilterButtonClass,
  getMainAmount,
  getPriorityClasses,
  getPriorityLabel,
  getSearchText,
  getStatusClasses,
  getStickyBodyClass,
  getStickyHeaderClass,
  getTechnicianName,
  getTimingMeta,
} from "./utils/followUpsPageUtils";
import { TableHeaderCell } from "./components/TableHeaderCell";

function TableBodyCell({
  children,
  columnKey,
  isSelected,
  className = "",
}: {
  children: ReactNode;
  columnKey: ColumnKey;
  isSelected: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex min-w-0 items-center border-r border-slate-100 px-4 py-3 last:border-r-0",
        getStickyBodyClass(columnKey, isSelected),
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
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

function MetricCard({
  title,
  value,
  detail,
  accentClass,
  bgClass,
}: {
  title: string;
  value: number;
  detail: string;
  accentClass: string;
  bgClass: string;
}) {
  return (
    <article
      className={[
        "rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        bgClass,
      ].join(" ")}
    >
      <p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">
        {title}
      </p>
      <p className={`mt-3 text-3xl font-black ${accentClass}`}>{value}</p>
      <p className="mt-1 text-sm font-medium opacity-80">{detail}</p>
    </article>
  );
}

function ColumnPicker({
  isOpen,
  visibleColumns,
  onToggleColumn,
}: {
  isOpen: boolean;
  visibleColumns: VisibleColumns;
  onToggleColumn: (columnKey: OptionalColumnKey) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      <div className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        Mostrar columnas
      </div>

      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
        Mantenimiento y Acciones siempre permanecen visibles.
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

function FollowUpPreviewPanel({
  item,
  businessCurrency,
  businessLocale,
}: {
  item: FollowUp | null;
  businessCurrency: string;
  businessLocale: string;
}) {
  if (!item) {
    return (
      <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-bold text-slate-800">
          Resumen de mantenimiento
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Selecciona un mantenimiento de la tabla para ver su información y
          acciones rápidas.
        </p>
      </aside>
    );
  }

  const clientName = getClientName(item.client);
  const maintenanceType = formatMaintenanceType(item.maintenance_type);
  const technicianName = getTechnicianName(item.technician);
  const timingMeta = getTimingMeta(
    item.target_date,
    item.follow_up_status?.code,
  );
  const targetDate = formatDateLabel(item.target_date, businessLocale);
  const scheduledDate = formatDateLabel(item.scheduled_date, businessLocale);
  const dueDate = formatDateLabel(item.due_date, businessLocale);
  const installationDate = formatDateLabel(
    item.installation?.installation_date,
    businessLocale,
  );
  const amount = getMainAmount(item);
  const amountLabel =
    amount === null
      ? "No definido"
      : formatMoney(amount, businessCurrency, businessLocale);
  const statusName = item.follow_up_status?.name || "Sin estado";
  const installationName =
    item.installation?.description || "Sin instalación asociada";

  return (
    <aside className="sticky top-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Resumen de mantenimiento
        </p>

        <h2
          title={clientName}
          className="mt-2 line-clamp-2 text-xl font-black tracking-tight text-slate-950"
        >
          {clientName}
        </h2>

        <p
          title={maintenanceType}
          className="mt-1 truncate text-sm font-semibold text-slate-500"
        >
          {maintenanceType}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
              item.follow_up_status?.code,
            )}`}
          >
            {statusName}
          </span>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getPriorityClasses(
              item.priority,
            )}`}
          >
            {getPriorityLabel(item.priority)}
          </span>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${timingMeta.classes}`}
          >
            {timingMeta.label}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <DetailField
            label="Fecha objetivo"
            value={targetDate || "No disponible"}
          />
          <DetailField
            label="Fecha agendada"
            value={scheduledDate || "Sin agendar"}
          />
          <DetailField label="Fecha límite" value={dueDate || "No definida"} />
          <DetailField label="Técnico" value={technicianName} />
          <DetailField label="Monto" value={amountLabel} />
          <DetailField
            label="Teléfono"
            value={item.client?.phone_primary || "No disponible"}
          />
          <DetailField
            label="Facturación"
            value={getBillingStatusLabel(item.billing_status)}
          />
          <DetailField label="Instalación">
            <span title={installationName} className="block truncate">
              {installationName}
            </span>
          </DetailField>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-950">Acciones rápidas</p>
          <p className="mt-1 text-xs font-medium leading-5 text-blue-700">
            Usa este panel para trabajar con el mantenimiento seleccionado sin
            perder la lista.
          </p>
        </div>

        <div className="grid gap-2">
          <Link
            href={`/follow-ups/${item.follow_up_id}`}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Ver detalle completo
          </Link>

          <Link
            href={`/contact-attempts/new?follow_up_id=${item.follow_up_id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Registrar intento
          </Link>

          <Link
            href={`/clients/${item.client_id}`}
            className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
          >
            Ver cliente
          </Link>

          {item.installation_id && (
            <Link
              href={`/installations/${item.installation_id}`}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver instalación
            </Link>
          )}
        </div>

        {installationDate && (
          <p className="text-xs font-medium text-slate-500">
            Fecha de instalación: {installationDate}
          </p>
        )}
      </div>
    </aside>
  );
}

export default function FollowUpsPage() {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");

  const defaultBusinessMeta = useMemo(() => getBusinessCountryMeta(), []);
  const [businessCurrency, setBusinessCurrency] = useState(
    defaultBusinessMeta.currency,
  );
  const [businessLocale, setBusinessLocale] = useState(
    defaultBusinessMeta.locale,
  );

  const [statusFilter, setStatusFilter] = useState<FollowUpFilter>("all");
  const [timingFilter, setTimingFilter] = useState<TimingFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("targetDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 25,
    totalItems: 0,
    totalPages: 1,
  });
  const [metrics, setMetrics] = useState<FollowUpMetrics>({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    today: 0,
    pendingBilling: 0,
  });
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(
    INITIAL_COLUMN_WIDTHS,
  );
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(
    INITIAL_VISIBLE_COLUMNS,
  );
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  const displayedColumns = useMemo<ColumnKey[]>(() => {
    const middleColumns = OPTIONAL_COLUMNS.filter(
      (column) => visibleColumns[column.key],
    ).map((column) => column.key);

    return ["maintenance", ...middleColumns, "actions"];
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
    const controller = new AbortController();

    async function loadBusinessSettings() {
      try {
        const res = await fetch("/api/settings", {
          cache: "no-store",
          signal: controller.signal,
        });

        const result: AppSettingsResponse = await res.json();

        if (!res.ok || !result.success) {
          return;
        }

        const businessMeta = getBusinessCountryMeta(result.data);

        setBusinessCurrency(businessMeta.currency);
        setBusinessLocale(businessMeta.locale);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        // Keep default business metadata if settings cannot be loaded.
      }
    }

    async function loadFollowUps() {
      try {
        setLoading(true);
        setError("");

        await loadBusinessSettings();

        const params = new URLSearchParams();

        params.set("page", String(currentPage));
        params.set("pageSize", String(pageSize));
        params.set("sortKey", sortKey);
        params.set("sortDirection", sortDirection);

        if (searchTerm.trim()) {
          params.set("search", searchTerm.trim());
        }

        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        if (timingFilter !== "all") {
          params.set("timing", timingFilter);
        }

        if (priorityFilter !== "all") {
          params.set("priority", priorityFilter);
        }

        if (billingFilter !== "all") {
          params.set("billingStatus", billingFilter);
        }

        const res = await fetch(`/api/follow-ups?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error("Failed to load follow ups");
        }

        const nextItems: FollowUp[] = Array.isArray(result.data)
          ? result.data
          : [];
        const nextPagination: PaginationState = result.pagination ?? {
          page: currentPage,
          pageSize,
          totalItems: nextItems.length,
          totalPages: 1,
        };

        setItems(nextItems);
        setPagination(nextPagination);
        setMetrics({
          total: Number(
            result.metrics?.total ?? nextPagination.totalItems ?? 0,
          ),
          pending: Number(result.metrics?.pending ?? 0),
          completed: Number(result.metrics?.completed ?? 0),
          overdue: Number(result.metrics?.overdue ?? 0),
          today: Number(result.metrics?.today ?? 0),
          pendingBilling: Number(result.metrics?.pendingBilling ?? 0),
        });
        setSelectedFollowUpId((currentSelectedId) => {
          if (
            currentSelectedId &&
            nextItems.some((item) => item.follow_up_id === currentSelectedId)
          ) {
            return currentSelectedId;
          }

          return nextItems[0]?.follow_up_id ?? null;
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

        setError("No se pudieron cargar los mantenimientos");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      }
    }

    void loadFollowUps();

    return () => controller.abort();
  }, [
    billingFilter,
    currentPage,
    pageSize,
    priorityFilter,
    searchTerm,
    sortDirection,
    sortKey,
    statusFilter,
    timingFilter,
  ]);

  const counters = metrics;

  const filteredItems = items;

  useEffect(() => {
    setSelectedFollowUpId((currentSelectedId) => {
      if (
        currentSelectedId &&
        filteredItems.some((item) => item.follow_up_id === currentSelectedId)
      ) {
        return currentSelectedId;
      }

      return filteredItems[0]?.follow_up_id ?? null;
    });
  }, [filteredItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    billingFilter,
    pageSize,
    priorityFilter,
    searchTerm,
    sortDirection,
    sortKey,
    statusFilter,
    timingFilter,
  ]);

  const visibleTotal = pagination.totalItems;
  const totalPages = Math.max(1, pagination.totalPages);
  const safeCurrentPage = Math.min(pagination.page || currentPage, totalPages);
  const pageStartIndex =
    visibleTotal === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const pageEndIndex = Math.min(safeCurrentPage * pageSize, visibleTotal);
  const paginatedItems = items;

  const selectedItem = useMemo(
    () =>
      filteredItems.find((item) => item.follow_up_id === selectedFollowUpId) ??
      null,
    [filteredItems, selectedFollowUpId],
  );

  function clearFilters() {
    setStatusFilter("all");
    setTimingFilter("all");
    setPriorityFilter("all");
    setBillingFilter("all");
    setSortKey("targetDate");
    setSortDirection("asc");
    setSearchTerm("");
  }

  function toggleColumn(columnKey: OptionalColumnKey) {
    setVisibleColumns((current) => ({
      ...current,
      [columnKey]: !current[columnKey],
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

      setSortDirection(nextSortKey === "amount" ? "desc" : "asc");
      return nextSortKey;
    });
  }

  function startColumnResize(
    event: ReactMouseEvent<HTMLSpanElement>,
    columnKey: ColumnKey,
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (columnKey === "maintenance" || columnKey === "actions") return;

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

  if (loading && !hasLoadedOnce) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-[1500px] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Cargando mantenimientos...
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
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Centro operativo
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Mantenimientos
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Cliente, instalación, técnico, agenda y facturación conectados en
              una sola vista.
            </p>
          </div>

          <Link
            href="/follow-ups/new"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nuevo mantenimiento
          </Link>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            title="Total"
            value={counters.total}
            detail="Registrados"
            accentClass="text-slate-950"
            bgClass="border-slate-200 bg-white text-slate-500"
          />

          <MetricCard
            title="Pendientes"
            value={counters.pending}
            detail="En seguimiento"
            accentClass="text-blue-800"
            bgClass="border-blue-200 bg-blue-50 text-blue-600"
          />

          <MetricCard
            title="Atrasados"
            value={counters.overdue}
            detail="Atención urgente"
            accentClass="text-red-800"
            bgClass="border-red-200 bg-red-50 text-red-600"
          />

          <MetricCard
            title="Hoy"
            value={counters.today}
            detail="Para revisar"
            accentClass="text-amber-800"
            bgClass="border-amber-200 bg-amber-50 text-amber-600"
          />

          <MetricCard
            title="Facturación"
            value={counters.pendingBilling}
            detail="Pendientes"
            accentClass="text-violet-800"
            bgClass="border-violet-200 bg-violet-50 text-violet-600"
          />

          <MetricCard
            title="Cerrados"
            value={counters.completed}
            detail="Completados"
            accentClass="text-emerald-800"
            bgClass="border-emerald-200 bg-emerald-50 text-emerald-600"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Buscar
                </label>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por cliente, teléfono, instalación, técnico o motivo..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Prioridad
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as PriorityFilter)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-300"
                >
                  <option value="all">Todas</option>
                  <option value="1">Alta</option>
                  <option value="2">Media</option>
                  <option value="3">Baja</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">
                  Facturación
                </label>
                <select
                  value={billingFilter}
                  onChange={(e) =>
                    setBillingFilter(e.target.value as BillingFilter)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-300"
                >
                  <option value="all">Todos</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="INVOICED">Facturado</option>
                  <option value="PARTIALLY_PAID">Pago parcial</option>
                  <option value="PAID">Pagado</option>
                  <option value="NOT_BILLABLE">No facturable</option>
                  <option value="BILLING_ERROR">Error</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Estado
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={getFilterButtonClass(statusFilter === "all")}
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter("pending")}
                    className={getFilterButtonClass(statusFilter === "pending")}
                  >
                    Pendientes
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter("completed")}
                    className={getFilterButtonClass(
                      statusFilter === "completed",
                    )}
                  >
                    Completados
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter("postponed")}
                    className={getFilterButtonClass(
                      statusFilter === "postponed",
                    )}
                  >
                    Pospuestos
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Urgencia
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTimingFilter("all")}
                    className={getFilterButtonClass(timingFilter === "all")}
                  >
                    Todas
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimingFilter("overdue")}
                    className={getFilterButtonClass(timingFilter === "overdue")}
                  >
                    Atrasados
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimingFilter("today")}
                    className={getFilterButtonClass(timingFilter === "today")}
                  >
                    Hoy
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimingFilter("upcoming")}
                    className={getFilterButtonClass(
                      timingFilter === "upcoming",
                    )}
                  >
                    Próximos
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
              <p>
                Mostrando{" "}
                <span className="font-bold">
                  {pageStartIndex}-{pageEndIndex}
                </span>{" "}
                de <span className="font-bold">{visibleTotal}</span>{" "}
                mantenimiento{visibleTotal === 1 ? "" : "s"}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {loading && hasLoadedOnce && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    Actualizando...
                  </span>
                )}

                <div ref={columnMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsColumnMenuOpen((current) => !current)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
                  >
                    Columnas
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  <ColumnPicker
                    isOpen={isColumnMenuOpen}
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

                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          {filteredItems.length === 0 ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-base font-bold text-slate-800">
                No se encontraron mantenimientos
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Prueba con otro filtro o registra un nuevo mantenimiento.
              </p>

              <Link
                href="/follow-ups/new"
                className="mt-5 inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Crear mantenimiento
              </Link>
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
                        activeSortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleHeaderSort}
                        onResizeStart={startColumnResize}
                      />
                    ))}
                  </div>

                  <ul className="divide-y divide-slate-100">
                    {paginatedItems.map((item) => {
                      const clientName = getClientName(item.client);
                      const maintenanceType = formatMaintenanceType(
                        item.maintenance_type,
                      );
                      const technicianName = getTechnicianName(item.technician);
                      const targetDate = formatDateLabel(
                        item.target_date,
                        businessLocale,
                      );
                      const scheduledDate = formatDateLabel(
                        item.scheduled_date,
                        businessLocale,
                      );
                      const timingMeta = getTimingMeta(
                        item.target_date,
                        item.follow_up_status?.code,
                      );
                      const amount = getMainAmount(item);
                      const isSelected =
                        item.follow_up_id === selectedFollowUpId;

                      return (
                        <li
                          key={item.follow_up_id}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setSelectedFollowUpId(item.follow_up_id)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedFollowUpId(item.follow_up_id);
                            }
                          }}
                          style={{ gridTemplateColumns }}
                          className={[
                            "group grid min-h-[76px] cursor-pointer transition hover:bg-blue-50/70",
                            isSelected
                              ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                              : "bg-white",
                          ].join(" ")}
                        >
                          <TableBodyCell
                            columnKey="maintenance"
                            isSelected={isSelected}
                          >
                            <div className="flex min-w-0 items-center gap-4">
                              <div
                                className={[
                                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black transition",
                                  isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
                                ].join(" ")}
                              >
                                <Wrench className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <Link
                                  href={`/follow-ups/${item.follow_up_id}`}
                                  onClick={(event) => event.stopPropagation()}
                                  className="block"
                                >
                                  <h2
                                    title={clientName}
                                    className="truncate text-sm font-black text-slate-950 transition hover:text-blue-700"
                                  >
                                    {clientName}
                                  </h2>
                                </Link>

                                <p
                                  title={maintenanceType}
                                  className="mt-1 truncate text-xs font-medium text-slate-500"
                                >
                                  {maintenanceType}
                                </p>
                              </div>
                            </div>
                          </TableBodyCell>

                          {visibleColumns.client && (
                            <TableBodyCell
                              columnKey="client"
                              isSelected={isSelected}
                            >
                              <div className="min-w-0">
                                <p
                                  title={
                                    item.client?.phone_primary || "Sin teléfono"
                                  }
                                  className="truncate text-sm font-semibold text-slate-700"
                                >
                                  {item.client?.phone_primary || "Sin teléfono"}
                                </p>
                                <p
                                  title={
                                    item.reason || "Mantenimiento programado"
                                  }
                                  className="mt-1 truncate text-xs text-slate-500"
                                >
                                  {item.reason || "Mantenimiento programado"}
                                </p>
                              </div>
                            </TableBodyCell>
                          )}

                          {visibleColumns.installation && (
                            <TableBodyCell
                              columnKey="installation"
                              isSelected={isSelected}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                                <span
                                  title={
                                    item.installation?.description ||
                                    "Sin instalación asociada"
                                  }
                                  className="truncate text-sm font-semibold text-slate-700"
                                >
                                  {item.installation?.description ||
                                    "Sin instalación asociada"}
                                </span>
                              </div>
                            </TableBodyCell>
                          )}

                          {visibleColumns.targetDate && (
                            <TableBodyCell
                              columnKey="targetDate"
                              isSelected={isSelected}
                            >
                              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
                                <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                                <span
                                  title={targetDate || "No disponible"}
                                  className="truncate"
                                >
                                  {targetDate || "No disponible"}
                                </span>
                              </div>
                            </TableBodyCell>
                          )}

                          {visibleColumns.scheduledDate && (
                            <TableBodyCell
                              columnKey="scheduledDate"
                              isSelected={isSelected}
                            >
                              <span
                                title={scheduledDate || "Sin agendar"}
                                className="truncate text-sm font-semibold text-slate-700"
                              >
                                {scheduledDate || "Sin agendar"}
                              </span>
                            </TableBodyCell>
                          )}

                          {visibleColumns.technician && (
                            <TableBodyCell
                              columnKey="technician"
                              isSelected={isSelected}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                                <span
                                  title={technicianName}
                                  className="truncate text-sm font-semibold text-slate-700"
                                >
                                  {technicianName}
                                </span>
                              </div>
                            </TableBodyCell>
                          )}

                          {visibleColumns.priority && (
                            <TableBodyCell
                              columnKey="priority"
                              isSelected={isSelected}
                            >
                              <span
                                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getPriorityClasses(
                                  item.priority,
                                )}`}
                              >
                                {getPriorityLabel(item.priority)}
                              </span>
                            </TableBodyCell>
                          )}

                          {visibleColumns.amount && (
                            <TableBodyCell
                              columnKey="amount"
                              isSelected={isSelected}
                            >
                              <span
                                title={
                                  amount === null
                                    ? "No definido"
                                    : formatMoney(
                                        amount,
                                        businessCurrency,
                                        businessLocale,
                                      )
                                }
                                className="truncate text-sm font-bold text-slate-800"
                              >
                                {amount === null
                                  ? "No definido"
                                  : formatMoney(
                                      amount,
                                      businessCurrency,
                                      businessLocale,
                                    )}
                              </span>
                            </TableBodyCell>
                          )}

                          {visibleColumns.billing && (
                            <TableBodyCell
                              columnKey="billing"
                              isSelected={isSelected}
                            >
                              <span
                                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getBillingStatusClasses(
                                  item.billing_status,
                                )}`}
                              >
                                {getBillingStatusLabel(item.billing_status)}
                              </span>
                            </TableBodyCell>
                          )}

                          {visibleColumns.status && (
                            <TableBodyCell
                              columnKey="status"
                              isSelected={isSelected}
                            >
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                                    item.follow_up_status?.code,
                                  )}`}
                                >
                                  {item.follow_up_status?.name || "Sin estado"}
                                </span>

                                <span
                                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${timingMeta.classes}`}
                                >
                                  {timingMeta.label}
                                </span>
                              </div>
                            </TableBodyCell>
                          )}

                          <TableBodyCell
                            columnKey="actions"
                            isSelected={isSelected}
                            className="justify-end"
                          >
                            <Link
                              href={`/follow-ups/${item.follow_up_id}`}
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                            >
                              Ver detalle
                            </Link>
                          </TableBodyCell>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Mostrando {pageStartIndex}-{pageEndIndex} de {visibleTotal}{" "}
                  mantenimiento
                  {visibleTotal === 1 ? "" : "s"} · Página {safeCurrentPage} de{" "}
                  {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={safeCurrentPage <= 1}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={safeCurrentPage >= totalPages}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </section>
          )}

          <FollowUpPreviewPanel
            item={selectedItem}
            businessCurrency={businessCurrency}
            businessLocale={businessLocale}
          />
        </div>
      </div>
    </main>
  );
}



