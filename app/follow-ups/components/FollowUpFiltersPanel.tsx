"use client";

import { ChevronDown, Search } from "lucide-react";
import type { RefObject } from "react";
import { PAGE_SIZE_OPTIONS } from "../constants/followUpsPageConstants";
import type {
  BillingFilter,
  FollowUpFilter,
  OptionalColumnKey,
  PriorityFilter,
  TimingFilter,
  VisibleColumns,
} from "../types/followUpsPageTypes";
import { ColumnPicker } from "./ColumnPicker";

type FollowUpFiltersPanelProps = {
  searchTerm: string;
  priorityFilter: PriorityFilter;
  billingFilter: BillingFilter;
  statusFilter: FollowUpFilter;
  timingFilter: TimingFilter;
  pageSize: number;
  pageStartIndex: number;
  pageEndIndex: number;
  visibleTotal: number;
  loading: boolean;
  hasLoadedOnce: boolean;
  isColumnMenuOpen: boolean;
  columnMenuRef: RefObject<HTMLDivElement | null>;
  visibleColumns: VisibleColumns;
  onSearchTermChange: (value: string) => void;
  onPriorityFilterChange: (value: PriorityFilter) => void;
  onBillingFilterChange: (value: BillingFilter) => void;
  onStatusFilterChange: (value: FollowUpFilter) => void;
  onTimingFilterChange: (value: TimingFilter) => void;
  onPageSizeChange: (value: number) => void;
  onToggleColumnMenu: () => void;
  onToggleColumn: (columnKey: OptionalColumnKey) => void;
  onClearFilters: () => void;
};

function getFilterButtonClass(isActive: boolean) {
  return [
    "inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition",
    isActive
      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ].join(" ");
}

const pageSizeOptions = Array.from(new Set([15, ...PAGE_SIZE_OPTIONS]));

export function FollowUpFiltersPanel({
  searchTerm,
  priorityFilter,
  billingFilter,
  statusFilter,
  timingFilter,
  pageSize,
  pageStartIndex,
  pageEndIndex,
  visibleTotal,
  loading,
  hasLoadedOnce,
  isColumnMenuOpen,
  columnMenuRef,
  visibleColumns,
  onSearchTermChange,
  onPriorityFilterChange,
  onBillingFilterChange,
  onStatusFilterChange,
  onTimingFilterChange,
  onPageSizeChange,
  onToggleColumnMenu,
  onToggleColumn,
  onClearFilters,
}: FollowUpFiltersPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(360px,1fr)_180px_190px] xl:items-end">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Buscar
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                placeholder="Buscar por cliente, teléfono, instalación, técnico o motivo..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Prioridad
            </label>

            <select
              value={priorityFilter}
              onChange={(event) =>
                onPriorityFilterChange(event.target.value as PriorityFilter)
              }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="all">Todas</option>
              <option value="1">Alta</option>
              <option value="2">Media</option>
              <option value="3">Baja</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Facturación
            </label>

            <select
              value={billingFilter}
              onChange={(event) =>
                onBillingFilterChange(event.target.value as BillingFilter)
              }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
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

        <div className="grid gap-3 border-t border-slate-100 pt-3 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Estado
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onStatusFilterChange("all")}
                className={getFilterButtonClass(statusFilter === "all")}
              >
                Todos
              </button>

              <button
                type="button"
                onClick={() => onStatusFilterChange("pending")}
                className={getFilterButtonClass(statusFilter === "pending")}
              >
                Pendientes
              </button>

              <button
                type="button"
                onClick={() => onStatusFilterChange("completed")}
                className={getFilterButtonClass(statusFilter === "completed")}
              >
                Completados
              </button>

              <button
                type="button"
                onClick={() => onStatusFilterChange("postponed")}
                className={getFilterButtonClass(statusFilter === "postponed")}
              >
                Pospuestos
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Urgencia
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onTimingFilterChange("all")}
                className={getFilterButtonClass(timingFilter === "all")}
              >
                Todas
              </button>

              <button
                type="button"
                onClick={() => onTimingFilterChange("overdue")}
                className={getFilterButtonClass(timingFilter === "overdue")}
              >
                Atrasados
              </button>

              <button
                type="button"
                onClick={() => onTimingFilterChange("today")}
                className={getFilterButtonClass(timingFilter === "today")}
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => onTimingFilterChange("upcoming")}
                className={getFilterButtonClass(timingFilter === "upcoming")}
              >
                Próximos
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {loading && hasLoadedOnce && (
              <span className="inline-flex h-9 items-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-600">
                Actualizando...
              </span>
            )}

            <div ref={columnMenuRef} className="relative">
              <button
                type="button"
                onClick={onToggleColumnMenu}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Columnas
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              <ColumnPicker
                isOpen={isColumnMenuOpen}
                visibleColumns={visibleColumns}
                onToggleColumn={onToggleColumn}
              />
            </div>

            <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm">
              Ver
              <select
                value={pageSize}
                onChange={(event) =>
                  onPageSizeChange(Number(event.target.value))
                }
                className="bg-transparent text-sm font-semibold outline-none"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
          Mostrando{" "}
          <span className="font-semibold text-slate-900">
            {pageStartIndex}-{pageEndIndex}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-slate-900">{visibleTotal}</span>{" "}
          mantenimiento{visibleTotal === 1 ? "" : "s"}
        </div>
      </div>
    </section>
  );
}
