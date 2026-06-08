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

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setCurrentPage(1);
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
      </div>
    </main>
  );
}
