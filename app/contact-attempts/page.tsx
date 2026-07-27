"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ContactAttemptPreviewPanel } from "./components/ContactAttemptPreviewPanel";
import ContactFlowChat from "./components/ContactFlowChat";
import { ContactAttemptsFilters } from "./components/ContactAttemptsFilters";
import type {
  DateFilter,
  ObjectiveFilter,
  OperationalZoneFilter,
  OperationalZoneOption,
  RiskFilter,
} from "./components/ContactAttemptsFilters";
import { ContactAttemptsMetrics } from "./components/ContactAttemptsMetrics";
import type { ContactStatusFilter } from "./components/ContactAttemptsMetrics";
import { ContactAttemptsPagination } from "./components/ContactAttemptsPagination";
import { ContactAttemptsTable } from "./components/ContactAttemptsTable";
import type {
  ContactFlowSortKey,
  SortDirection,
} from "./components/ContactAttemptsTable";
import type { ApiResponse, ContactFlowItem, FilterType } from "./types";
import {
  getClientFullName,
  getLastMessagePreview,
  getOperationalRisk,
} from "./utils";

type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type ContactFlowMetrics = {
  all: number;
  unread: number;
  waiting: number;
  confirmed: number;
  manual: number;
};

type OperationalZoneApiItem = OperationalZoneOption & {
  is_active?: boolean | null;
};

type OperationalZonesApiResponse = {
  success: boolean;
  data?: OperationalZoneApiItem[];
};

export default function ContactAttemptsPage() {
  const [flows, setFlows] = useState<ContactFlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContactStatusFilter>("active");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [objectiveFilter, setObjectiveFilter] =
    useState<ObjectiveFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [operationalZoneFilter, setOperationalZoneFilter] =
    useState<OperationalZoneFilter>("all");
  const [operationalZoneOptions, setOperationalZoneOptions] = useState<
    OperationalZoneOption[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [conversationFlow, setConversationFlow] =
    useState<ContactFlowItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 15,
    totalItems: 0,
    totalPages: 1,
  });
  const [metrics, setMetrics] = useState<ContactFlowMetrics>({
    all: 0,
    unread: 0,
    waiting: 0,
    confirmed: 0,
    manual: 0,
  });
  const [sortKey, setSortKey] = useState<ContactFlowSortKey>("lastInteraction");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const loadFlows = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError(null);

        const params = new URLSearchParams();

        params.set("page", String(currentPage));
        params.set("pageSize", String(pageSize));

        const apiFilter: FilterType =
          filter === "active" || filter === "archived" ? "all" : filter;

        params.set("filter", apiFilter);
        params.set("sortKey", sortKey);
        params.set("sortDirection", sortDirection);

        const response = await fetch(
          `/api/contact-flows?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("No se pudo cargar la gestión de contactos.");
        }

        const result = (await response.json()) as ApiResponse & {
          pagination?: PaginationState;
          metrics?: Partial<ContactFlowMetrics>;
        };

        if (!result.success) {
          throw new Error("La respuesta del servidor no fue exitosa.");
        }

        const nextFlows = result.data ?? [];

        setFlows(nextFlows);
        setPagination(
          result.pagination ?? {
            page: currentPage,
            pageSize,
            totalItems: nextFlows.length,
            totalPages: 1,
          },
        );
        setMetrics({
          all: Number(result.metrics?.all ?? nextFlows.length),
          unread: Number(result.metrics?.unread ?? 0),
          waiting: Number(result.metrics?.waiting ?? 0),
          confirmed: Number(result.metrics?.confirmed ?? 0),
          manual: Number(result.metrics?.manual ?? 0),
        });

        setSelectedFlowId((currentSelectedId) => {
          if (
            currentSelectedId &&
            nextFlows.some((flow) => flow.contact_flow_id === currentSelectedId)
          ) {
            return currentSelectedId;
          }

          return null;
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error al cargar los contactos.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        hasLoadedOnceRef.current = true;
        setHasLoadedOnce(true);
      }
    },
    [currentPage, filter, pageSize, sortDirection, sortKey],
  );

  async function loadOperationalZones() {
    try {
      const response = await fetch("/api/operational-zones", {
        cache: "no-store",
      });

      const result = (await response.json()) as OperationalZonesApiResponse;

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        return;
      }

      const options = result.data
        .filter((zone) => zone.is_active !== false)
        .map((zone) => ({
          operational_zone_id: zone.operational_zone_id,
          name: zone.name,
        }))
        .sort((first, second) =>
          first.name.localeCompare(second.name, "es", {
            sensitivity: "base",
          }),
        );

      setOperationalZoneOptions(options);
    } catch (zoneError) {
      console.error("No se pudieron cargar las zonas operativas:", zoneError);
    }
  }

  useEffect(() => {
    void loadFlows(!hasLoadedOnceRef.current);
  }, [loadFlows]);

  useEffect(() => {
    void loadOperationalZones();
  }, []);

  function handleRefreshList() {
    void loadFlows(false);
  }

  function markFlowAsRead(flow: ContactFlowItem) {
    setFlows((currentFlows) =>
      currentFlows.map((item) =>
        item.contact_flow_id === flow.contact_flow_id
          ? {
              ...item,
              unread_count: 0,
              has_unread_messages: false,
            }
          : item,
      ),
    );
  }

  function handleSelectFlow(flow: ContactFlowItem) {
    setSelectedFlowId(flow.contact_flow_id);
  }

  function handleOpenConversation(flow: ContactFlowItem) {
    markFlowAsRead(flow);
    setSelectedFlowId(flow.contact_flow_id);

    setConversationFlow({
      ...flow,
      unread_count: 0,
      has_unread_messages: false,
    });
  }

  function handleFilterChange(nextFilter: ContactStatusFilter) {
    setCurrentPage(1);
    setFilter(nextFilter);
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  }

  function handleOperationalZoneFilterChange(
    nextFilter: OperationalZoneFilter,
  ) {
    setOperationalZoneFilter(nextFilter);
    setCurrentPage(1);
  }

  function handleSort(nextSortKey: ContactFlowSortKey) {
    setCurrentPage(1);
    setSortKey((currentSortKey) => {
      if (currentSortKey === nextSortKey) {
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        );

        return currentSortKey;
      }

      setSortDirection(nextSortKey === "lastInteraction" ? "desc" : "asc");
      return nextSortKey;
    });
  }

  function clearFilters() {
    setSearchTerm("");
    setFilter("active");
    setRiskFilter("all");
    setObjectiveFilter("all");
    setDateFilter("all");
    setOperationalZoneFilter("all");
    setCurrentPage(1);
  }

  const getOperationalZone = useCallback((flow: ContactFlowItem) => {
    return (
      flow.follow_up.operational_zone ??
      flow.installation?.operational_zone ??
      flow.client.operational_zone ??
      null
    );
  }, []);

  const matchesSearch = useCallback(
    (flow: ContactFlowItem) => {
      const searchValue = searchTerm.trim().toLowerCase();

      if (!searchValue) return true;

      const values = [
        getClientFullName(flow.client),
        flow.client.phone_primary,
        flow.installation?.description,
        flow.follow_up.reason,
        getOperationalZone(flow)?.name,
        getLastMessagePreview(flow.last_message),
      ];

      return values
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue));
    },
    [getOperationalZone, searchTerm],
  );

  const matchesRisk = useCallback(
    (flow: ContactFlowItem) => {
      if (riskFilter === "all") return true;

      const risk = getOperationalRisk(flow);
      const normalizedLabel = risk.label.toLowerCase();

      if (riskFilter === "attention") {
        return (
          normalizedLabel.includes("atención") ||
          normalizedLabel.includes("requerida")
        );
      }

      if (riskFilter === "followUp") {
        return (
          normalizedLabel.includes("seguimiento") ||
          normalizedLabel.includes("pendiente")
        );
      }

      if (riskFilter === "confirmed") {
        return normalizedLabel.includes("confirm");
      }

      return true;
    },
    [riskFilter],
  );

  const matchesObjective = useCallback(
    (flow: ContactFlowItem) => {
      if (objectiveFilter === "all") return true;

      if (objectiveFilter === "conversation") {
        return true;
      }

      if (objectiveFilter === "installation") {
        return Boolean(flow.installation?.installation_id);
      }

      if (objectiveFilter === "maintenance") {
        return Boolean(flow.follow_up?.follow_up_id);
      }

      return true;
    },
    [objectiveFilter],
  );

  const matchesOperationalZone = useCallback(
    (flow: ContactFlowItem) => {
      if (operationalZoneFilter === "all") return true;

      const operationalZone = getOperationalZone(flow);

      if (operationalZoneFilter === "unassigned") {
        return !operationalZone?.operational_zone_id;
      }

      return operationalZone?.operational_zone_id === operationalZoneFilter;
    },
    [getOperationalZone, operationalZoneFilter],
  );

  const matchesDate = useCallback(
    (flow: ContactFlowItem) => {
      if (dateFilter === "all") return true;

      const rawDate =
        flow.selected_date ||
        flow.follow_up.scheduled_date ||
        flow.follow_up.target_date;

      if (!rawDate) return false;

      const currentDate = new Date();
      const targetDate = new Date(rawDate);

      if (Number.isNaN(targetDate.getTime())) return false;

      const currentDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
      );
      const targetDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
      );

      const diffMs = targetDay.getTime() - currentDay.getTime();
      const diffDays = Math.round(diffMs / 86400000);

      if (dateFilter === "today") {
        return diffDays === 0;
      }

      if (dateFilter === "week") {
        return diffDays >= 0 && diffDays <= 7;
      }

      if (dateFilter === "month") {
        return (
          targetDate.getFullYear() === currentDate.getFullYear() &&
          targetDate.getMonth() === currentDate.getMonth()
        );
      }

      return true;
    },
    [dateFilter],
  );

  const filteredFlows = useMemo(() => {
    if (filter === "archived") {
      return [];
    }

    return flows.filter(
      (flow) =>
        matchesSearch(flow) &&
        matchesRisk(flow) &&
        matchesObjective(flow) &&
        matchesOperationalZone(flow) &&
        matchesDate(flow),
    );
  }, [
    filter,
    flows,
    matchesDate,
    matchesObjective,
    matchesOperationalZone,
    matchesRisk,
    matchesSearch,
  ]);

  useEffect(() => {
    setSelectedFlowId((currentSelectedId) => {
      if (
        currentSelectedId &&
        filteredFlows.some((flow) => flow.contact_flow_id === currentSelectedId)
      ) {
        return currentSelectedId;
      }

      return null;
    });
  }, [filteredFlows]);

  const selectedPreviewFlow = useMemo(
    () =>
      filteredFlows.find((flow) => flow.contact_flow_id === selectedFlowId) ??
      null,
    [filteredFlows, selectedFlowId],
  );

  const usesLocalFilters =
    filter === "archived" ||
    searchTerm.trim() !== "" ||
    riskFilter !== "all" ||
    objectiveFilter !== "all" ||
    operationalZoneFilter !== "all" ||
    dateFilter !== "all";

  const totalPages = usesLocalFilters ? 1 : Math.max(1, pagination.totalPages);
  const safeCurrentPage = usesLocalFilters
    ? 1
    : Math.min(pagination.page || currentPage, totalPages);
  const visibleTotal = usesLocalFilters
    ? filteredFlows.length
    : pagination.totalItems;
  const pageStartIndex =
    visibleTotal === 0
      ? 0
      : usesLocalFilters
        ? 1
        : (safeCurrentPage - 1) * pagination.pageSize + 1;
  const pageEndIndex = usesLocalFilters
    ? filteredFlows.length
    : Math.min(safeCurrentPage * pagination.pageSize, pagination.totalItems);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Intentos de contacto
          </h1>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Visualiza el estado de los contactos automáticos, respuestas y
            seguimientos de WhatsApp.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Nuevo intento manual
        </button>
      </div>

      <ContactAttemptsMetrics
        metrics={metrics}
        selectedFilter={filter}
        onFilterChange={handleFilterChange}
      />

      <ContactAttemptsFilters
        searchTerm={searchTerm}
        statusFilter={filter}
        riskFilter={riskFilter}
        objectiveFilter={objectiveFilter}
        dateFilter={dateFilter}
        operationalZoneFilter={operationalZoneFilter}
        operationalZoneOptions={operationalZoneOptions}
        pageSize={pageSize}
        refreshing={refreshing}
        onSearchTermChange={setSearchTerm}
        onStatusFilterChange={handleFilterChange}
        onRiskFilterChange={setRiskFilter}
        onObjectiveFilterChange={setObjectiveFilter}
        onDateFilterChange={setDateFilter}
        onOperationalZoneFilterChange={handleOperationalZoneFilterChange}
        onPageSizeChange={handlePageSizeChange}
        onClearFilters={clearFilters}
        onRefreshList={handleRefreshList}
      />

      {loading && !hasLoadedOnce ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Cargando contactos...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : filteredFlows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          {filter === "archived"
            ? "La vista de archivados está preparada en UI. Falta conectarla al backend."
            : "No hay contactos para mostrar con el filtro seleccionado."}
        </div>
      ) : (
        <ContactAttemptsTable
          flows={filteredFlows}
          selectedFlowId={selectedFlowId}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          onSelectFlow={handleSelectFlow}
          onOpenConversation={handleOpenConversation}
        />
      )}

      {selectedPreviewFlow ? (
        <ContactAttemptPreviewPanel
          flow={selectedPreviewFlow}
          onClose={() => setSelectedFlowId(null)}
          onOpenConversation={handleOpenConversation}
        />
      ) : null}

      {!loading && !error && filteredFlows.length > 0 && (
        <ContactAttemptsPagination
          pageStartIndex={pageStartIndex}
          pageEndIndex={pageEndIndex}
          totalItems={visibleTotal}
          safeCurrentPage={safeCurrentPage}
          totalPages={totalPages}
          refreshing={refreshing}
          onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
          onNextPage={() =>
            setCurrentPage((page) => Math.min(totalPages, page + 1))
          }
        />
      )}

      {conversationFlow && (
        <ContactFlowChat
          contactFlowId={conversationFlow.contact_flow_id}
          clientName={getClientFullName(conversationFlow.client)}
          installationName={
            conversationFlow.installation?.description ||
            "Instalación sin descripción"
          }
          onClose={() => setConversationFlow(null)}
          onMessageSent={loadFlows}
        />
      )}
    </div>
  );
}
