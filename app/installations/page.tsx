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
import { getBusinessCountryMeta } from "./utils/installationsPageUtils";
import { InstallationPreviewPanel } from "./components/InstallationPreviewPanel";
import { InstallationFiltersPanel } from "./components/InstallationFiltersPanel";
import { InstallationTable } from "./components/InstallationTable";

const DEFAULT_INSTALLATION_PAGE_SIZE = 15;

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
  const [pageSize, setPageSize] = useState(DEFAULT_INSTALLATION_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: DEFAULT_INSTALLATION_PAGE_SIZE,
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

    return ["installation", ...middleColumns];
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
        setLoading(true);
        setError("");

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

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Cargando instalaciones...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
          <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Instalaciones
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Gestiona instalaciones, servicios, técnicos, ubicaciones y
              actividad operativa.
            </p>
          </div>

          <Link
            href="/installations/new"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Nueva instalación
          </Link>
        </div>

        <InstallationFiltersPanel
          search={search}
          filter={filter}
          sortBy={sortBy}
          metrics={metrics}
          visibleColumns={visibleColumns}
          isColumnMenuOpen={isColumnMenuOpen}
          columnMenuRef={columnMenuRef}
          pageStartIndex={pageStartIndex}
          pageEndIndex={pageEndIndex}
          visibleTotal={visibleTotal}
          onSearchChange={setSearch}
          onFilterChange={setFilter}
          onSortChange={handleSortSelectChange}
          onToggleColumnMenu={() => setIsColumnMenuOpen((current) => !current)}
          onToggleColumn={toggleColumn}
        />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          {filteredInstallations.length === 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-base font-semibold text-slate-800">
                No se encontraron instalaciones
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Prueba con otro filtro o registra una nueva instalación.
              </p>
            </section>
          ) : (
            <InstallationTable
              installations={filteredInstallations}
              selectedInstallationId={selectedInstallationId}
              displayedColumns={displayedColumns}
              gridTemplateColumns={gridTemplateColumns}
              tableMinWidth={tableMinWidth}
              pageStartIndex={pageStartIndex}
              pageSize={pageSize}
              safeCurrentPage={safeCurrentPage}
              totalPages={totalPages}
              loading={loading}
              sortKey={sortKey}
              sortDirection={sortDirection}
              businessCurrency={businessCurrency}
              businessLocale={businessLocale}
              onSelectInstallation={setSelectedInstallationId}
              onHeaderSort={handleHeaderSort}
              onResizeStart={startColumnResize}
              onPageSizeChange={handlePageSizeChange}
              setCurrentPage={setCurrentPage}
            />
          )}

          <InstallationPreviewPanel
            installation={selectedInstallation}
            businessCurrency={businessCurrency}
            businessLocale={businessLocale}
          />
        </div>
      </section>
    </main>
  );
}
