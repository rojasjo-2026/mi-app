"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type SVGProps,
} from "react";
import {
  INITIAL_COLUMN_WIDTHS,
  INITIAL_VISIBLE_COLUMNS,
  MIN_COLUMN_WIDTHS,
  OPTIONAL_COLUMNS,
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
  TimingFilter,
  VisibleColumns,
} from "./types/followUpsPageTypes";
import { getBusinessCountryMeta } from "./utils/followUpsPageUtils";
import { FollowUpPreviewPanel } from "./components/FollowUpPreviewPanel";
import { FollowUpMetricsGrid } from "./components/FollowUpMetricsGrid";
import { FollowUpFiltersPanel } from "./components/FollowUpFiltersPanel";
import { FollowUpTable } from "./components/FollowUpTable";
import { FollowUpPagination } from "./components/FollowUpPagination";

const DEFAULT_FOLLOW_UP_PAGE_SIZE = 15;

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
  const [pageSize, setPageSize] = useState(DEFAULT_FOLLOW_UP_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_FOLLOW_UP_PAGE_SIZE,
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

    return ["maintenance", ...middleColumns];
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

    if (columnKey === "maintenance") return;

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

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setCurrentPage(1);
  }

  if (loading && !hasLoadedOnce) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 text-slate-900 md:p-6">
        <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
          <PageContextBar />

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Cargando mantenimientos...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 text-slate-900 md:p-6">
        <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
          <PageContextBar />

          <div className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 text-slate-900 md:p-6">
      <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
        <PageContextBar />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Mantenimientos
            </h1>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Cliente, instalación, técnico, agenda y facturación conectados en
              una sola vista.
            </p>
          </div>

          <Link
            href="/follow-ups/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Nuevo mantenimiento
          </Link>
        </div>

        <FollowUpMetricsGrid metrics={metrics} />

        <FollowUpFiltersPanel
          searchTerm={searchTerm}
          priorityFilter={priorityFilter}
          billingFilter={billingFilter}
          statusFilter={statusFilter}
          timingFilter={timingFilter}
          pageSize={pageSize}
          pageStartIndex={pageStartIndex}
          pageEndIndex={pageEndIndex}
          visibleTotal={visibleTotal}
          loading={loading}
          hasLoadedOnce={hasLoadedOnce}
          isColumnMenuOpen={isColumnMenuOpen}
          columnMenuRef={columnMenuRef}
          visibleColumns={visibleColumns}
          onSearchTermChange={setSearchTerm}
          onPriorityFilterChange={setPriorityFilter}
          onBillingFilterChange={setBillingFilter}
          onStatusFilterChange={setStatusFilter}
          onTimingFilterChange={setTimingFilter}
          onPageSizeChange={handlePageSizeChange}
          onToggleColumnMenu={() => setIsColumnMenuOpen((current) => !current)}
          onToggleColumn={toggleColumn}
          onClearFilters={clearFilters}
        />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          {filteredItems.length === 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-base font-semibold text-slate-800">
                No se encontraron mantenimientos
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Prueba con otro filtro o registra un nuevo mantenimiento.
              </p>

              <Link
                href="/follow-ups/new"
                className="mt-5 inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Crear mantenimiento
              </Link>
            </section>
          ) : (
            <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <FollowUpTable
                items={filteredItems}
                selectedFollowUpId={selectedFollowUpId}
                displayedColumns={displayedColumns}
                visibleColumns={visibleColumns}
                gridTemplateColumns={gridTemplateColumns}
                tableMinWidth={tableMinWidth}
                pageStartIndex={pageStartIndex}
                sortKey={sortKey}
                sortDirection={sortDirection}
                businessCurrency={businessCurrency}
                businessLocale={businessLocale}
                onSelectFollowUp={setSelectedFollowUpId}
                onHeaderSort={handleHeaderSort}
                onResizeStart={startColumnResize}
              />

              <FollowUpPagination
                pageStartIndex={pageStartIndex}
                pageEndIndex={pageEndIndex}
                visibleTotal={visibleTotal}
                safeCurrentPage={safeCurrentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            </section>
          )}

          <FollowUpPreviewPanel
            item={selectedItem}
            businessCurrency={businessCurrency}
            businessLocale={businessLocale}
          />
        </div>
      </section>
    </main>
  );
}

function PageContextBar() {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
      <nav
        aria-label="Ubicación actual"
        className="flex min-w-0 items-center gap-2 text-sm font-semibold"
      >
        <Link
          href="/"
          className="truncate text-blue-700 transition hover:text-blue-800"
        >
          Operaciones 360
        </Link>

        <span className="text-slate-300">/</span>

        <span className="truncate text-slate-800">Mantenimientos</span>
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          title="Búsqueda global - próximamente"
          aria-label="Búsqueda global - próximamente"
          className="inline-flex h-9 w-9 cursor-default items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
        >
          <SearchIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          title="Notificaciones - próximamente"
          aria-label="Notificaciones - próximamente"
          className="relative inline-flex h-9 w-9 cursor-default items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
        >
          <BellIcon className="h-4 w-4" />

          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            3
          </span>
        </button>

        <button
          type="button"
          title="Perfil de usuario - próximamente"
          aria-label="Perfil de usuario - próximamente"
          className="inline-flex cursor-default items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
            J
          </span>

          <span className="hidden md:inline">José Admin</span>

          <ChevronDownIcon className="hidden h-4 w-4 text-slate-400 md:block" />
        </button>
      </div>
    </div>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
