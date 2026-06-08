"use client";

import { Search, ChevronDown } from "lucide-react";
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
import { getFilterButtonClass } from "../utils/followUpsPageUtils";
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
                onChange={(event) => onSearchTermChange(event.target.value)}
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
              onChange={(event) =>
                onPriorityFilterChange(event.target.value as PriorityFilter)
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
              onChange={(event) =>
                onBillingFilterChange(event.target.value as BillingFilter)
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
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
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
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
          <p>
            Mostrando{" "}
            <span className="font-bold">
              {pageStartIndex}-{pageEndIndex}
            </span>{" "}
            de <span className="font-bold">{visibleTotal}</span> mantenimiento
            {visibleTotal === 1 ? "" : "s"}
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
                onClick={onToggleColumnMenu}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
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

            <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
              Ver
              <select
                value={pageSize}
                onChange={(event) =>
                  onPageSizeChange(Number(event.target.value))
                }
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
              onClick={onClearFilters}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
