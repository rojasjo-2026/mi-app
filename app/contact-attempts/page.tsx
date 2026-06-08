"use client";

import { useEffect, useMemo, useState } from "react";

import ContactFlowChat from "./components/ContactFlowChat";
import { ContactAttemptsFilters } from "./components/ContactAttemptsFilters";
import type {
  DateFilter,
  ObjectiveFilter,
  RiskFilter,
} from "./components/ContactAttemptsFilters";
import { ContactAttemptsHeader } from "./components/ContactAttemptsHeader";
import { ContactAttemptsMetrics } from "./components/ContactAttemptsMetrics";
import type { ContactStatusFilter } from "./components/ContactAttemptsMetrics";
import { ContactAttemptsPagination } from "./components/ContactAttemptsPagination";
import { ContactAttemptsTable } from "./components/ContactAttemptsTable";
import type {
  ContactFlowSortKey,
  SortDirection,
} from "./components/ContactAttemptsTable";
import type {
  ApiResponse,
  ContactFlowItem,
  FilterType,
  ViewMode,
} from "./types";
import {
  getClientFullName,
  getLastMessagePreview,
  getOperationalRisk,
  hasUnreadMessages,
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

export default function ContactAttemptsPage() {
  const [flows, setFlows] = useState<ContactFlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContactStatusFilter>("active");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [objectiveFilter, setObjectiveFilter] =
    useState<ObjectiveFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [mounted, setMounted] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<ContactFlowItem | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
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

  async function loadFlows(showLoader = true) {
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

      const response = await fetch(`/api/contact-flows?${params.toString()}`, {
        cache: "no-store",
      });

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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar los contactos.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setHasLoadedOnce(true);
    }
  }

  useEffect(() => {
    void loadFlows(!hasLoadedOnce);
  }, [filter, currentPage, pageSize, sortDirection, sortKey]);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleRefreshList() {
    void loadFlows(false);
  }

  function handleOpenConversation(flow: ContactFlowItem) {
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

    setSelectedFlow({
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
    setCurrentPage(1);
  }

  function matchesSearch(flow: ContactFlowItem) {
    const searchValue = searchTerm.trim().toLowerCase();

    if (!searchValue) return true;

    const values = [
      getClientFullName(flow.client),
      flow.client.phone_primary,
      flow.installation?.description,
      flow.follow_up.reason,
      getLastMessagePreview(flow.last_message),
    ];

    return values
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(searchValue));
  }

  function matchesRisk(flow: ContactFlowItem) {
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
  }

  function matchesObjective(flow: ContactFlowItem) {
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
  }

  function matchesDate(flow: ContactFlowItem) {
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
  }

  const filteredFlows = useMemo(() => {
    if (filter === "archived") {
      return [];
    }

    return flows.filter(
      (flow) =>
        matchesSearch(flow) &&
        matchesRisk(flow) &&
        matchesObjective(flow) &&
        matchesDate(flow),
    );
  }, [flows, filter, searchTerm, riskFilter, objectiveFilter, dateFilter]);

  const usesLocalFilters =
    filter === "archived" ||
    searchTerm.trim() !== "" ||
    riskFilter !== "all" ||
    objectiveFilter !== "all" ||
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
      <ContactAttemptsHeader
        refreshing={refreshing}
        onRefresh={handleRefreshList}
      />

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
        pageSize={pageSize}
        viewMode={viewMode}
        mounted={mounted}
        refreshing={refreshing}
        onSearchTermChange={setSearchTerm}
        onStatusFilterChange={handleFilterChange}
        onRiskFilterChange={setRiskFilter}
        onObjectiveFilterChange={setObjectiveFilter}
        onDateFilterChange={setDateFilter}
        onPageSizeChange={handlePageSizeChange}
        onViewModeChange={setViewMode}
        onClearFilters={clearFilters}
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
          sortKey={sortKey}
          sortDirection={sortDirection}
          viewMode={viewMode}
          onSort={handleSort}
          onOpenConversation={handleOpenConversation}
        />
      )}

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

      {selectedFlow && (
        <ContactFlowChat
          contactFlowId={selectedFlow.contact_flow_id}
          clientName={getClientFullName(selectedFlow.client)}
          installationName={
            selectedFlow.installation?.description ||
            "Instalación sin descripción"
          }
          onClose={() => setSelectedFlow(null)}
          onMessageSent={loadFlows}
        />
      )}
    </div>
  );
}
