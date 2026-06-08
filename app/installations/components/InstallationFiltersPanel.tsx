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
import { getFilterButtonClass } from "../utils/installationsPageUtils";
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
              onChange={(event) => onSearchChange(event.target.value)}
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
                  onClick={() => onFilterChange(statusFilter.value)}
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
            <InstallationColumnMenu
              isOpen={isColumnMenuOpen}
              columnMenuRef={columnMenuRef}
              visibleColumns={visibleColumns}
              onToggleOpen={onToggleColumnMenu}
              onToggleColumn={onToggleColumn}
            />

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-500">
                Ordenar por
              </span>

              <select
                value={sortBy}
                onChange={(event) =>
                  onSortChange(event.target.value as SortType)
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
  );
}
