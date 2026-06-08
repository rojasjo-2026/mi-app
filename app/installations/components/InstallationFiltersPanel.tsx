"use client";

import { Search } from "lucide-react";
import type { RefObject } from "react";
import {
  STATUS_FILTERS,
  type FilterType,
  type InstallationMetrics,
  type OptionalColumnKey,
  type SortType,
  type VisibleColumns,
} from "../config/installationsPageConfig";
import { InstallationColumnMenu } from "./InstallationColumnMenu";

type InstallationFiltersPanelProps = {
  search: string;
  filter: FilterType;
  sortBy: SortType;
  metrics: InstallationMetrics;
  visibleColumns: VisibleColumns;
  isColumnMenuOpen: boolean;
  columnMenuRef: RefObject<HTMLDivElement | null>;
  pageStartIndex: number;
  pageEndIndex: number;
  visibleTotal: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: FilterType) => void;
  onSortChange: (value: SortType) => void;
  onToggleColumnMenu: () => void;
  onToggleColumn: (columnKey: OptionalColumnKey) => void;
};

function getStatusButtonClass(isActive: boolean) {
  return [
    "inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-semibold transition",
    isActive
      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ].join(" ");
}

function getStatusCountClass(isActive: boolean) {
  return [
    "ml-2 rounded-full px-2 py-0.5 text-xs font-semibold",
    isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500",
  ].join(" ");
}

export function InstallationFiltersPanel({
  search,
  filter,
  sortBy,
  metrics,
  visibleColumns,
  isColumnMenuOpen,
  columnMenuRef,
  pageStartIndex,
  pageEndIndex,
  visibleTotal,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onToggleColumnMenu,
  onToggleColumn,
}: InstallationFiltersPanelProps) {
  function getStatusFilterCount(statusValue: FilterType) {
    if (statusValue === "all") return metrics.total;
    if (statusValue === "OPEN") return metrics.open;
    if (statusValue === "IN_PROGRESS") return metrics.inProgress;
    if (statusValue === "CLOSED") return metrics.closed;
    if (statusValue === "CANCELLED") return metrics.cancelled;

    return 0;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(360px,1fr)_auto] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por cliente, descripción, técnico, servicio, ubicación o código..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <InstallationColumnMenu
              isOpen={isColumnMenuOpen}
              columnMenuRef={columnMenuRef}
              visibleColumns={visibleColumns}
              onToggleOpen={onToggleColumnMenu}
              onToggleColumn={onToggleColumn}
            />

            <select
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value as SortType)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="recent">Más recientes</option>
              <option value="oldest">Más antiguas</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((statusFilter) => {
              const isActive = filter === statusFilter.value;

              return (
                <button
                  key={statusFilter.value}
                  type="button"
                  onClick={() => onFilterChange(statusFilter.value)}
                  className={getStatusButtonClass(isActive)}
                >
                  {statusFilter.label}
                  <span className={getStatusCountClass(isActive)}>
                    {getStatusFilterCount(statusFilter.value)}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="whitespace-nowrap text-sm font-semibold text-slate-600">
            Mostrando{" "}
            <span className="text-slate-900">
              {pageStartIndex}-{pageEndIndex}
            </span>{" "}
            de <span className="text-slate-900">{visibleTotal}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
