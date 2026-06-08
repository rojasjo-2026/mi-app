"use client";

import type { ViewMode } from "../types";
import type { ContactStatusFilter } from "./ContactAttemptsMetrics";

type RiskFilter = "all" | "attention" | "followUp" | "confirmed";
type ObjectiveFilter = "all" | "conversation" | "installation" | "maintenance";
type DateFilter = "all" | "today" | "week" | "month";

type ContactAttemptsFiltersProps = {
  searchTerm: string;
  statusFilter: ContactStatusFilter;
  riskFilter: RiskFilter;
  objectiveFilter: ObjectiveFilter;
  dateFilter: DateFilter;
  pageSize: number;
  viewMode: ViewMode;
  mounted: boolean;
  refreshing: boolean;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: ContactStatusFilter) => void;
  onRiskFilterChange: (value: RiskFilter) => void;
  onObjectiveFilterChange: (value: ObjectiveFilter) => void;
  onDateFilterChange: (value: DateFilter) => void;
  onPageSizeChange: (value: number) => void;
  onViewModeChange: (value: ViewMode) => void;
  onClearFilters: () => void;
  onRefreshList: () => void;
};

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

function getChipClass(active: boolean) {
  return [
    "inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition",
    active
      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ].join(" ");
}

export function ContactAttemptsFilters({
  searchTerm,
  statusFilter,
  riskFilter,
  objectiveFilter,
  dateFilter,
  pageSize,
  viewMode,
  mounted,
  refreshing,
  onSearchTermChange,
  onStatusFilterChange,
  onRiskFilterChange,
  onObjectiveFilterChange,
  onDateFilterChange,
  onPageSizeChange,
  onViewModeChange,
  onClearFilters,
  onRefreshList,
}: ContactAttemptsFiltersProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(360px,1fr)_180px_180px_180px] xl:items-end">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Buscar
            </label>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Buscar por cliente, teléfono, instalación o mensaje..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Estado
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                onStatusFilterChange(event.target.value as ContactStatusFilter)
              }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="active">Activos</option>
              <option value="unread">Sin leer</option>
              <option value="waiting">En gestión</option>
              <option value="confirmed">Confirmados</option>
              <option value="manual">Manual</option>
              <option value="archived">Archivados</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Riesgo
            </label>

            <select
              value={riskFilter}
              onChange={(event) =>
                onRiskFilterChange(event.target.value as RiskFilter)
              }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="all">Todos</option>
              <option value="attention">Atención requerida</option>
              <option value="followUp">Seguimiento pendiente</option>
              <option value="confirmed">Confirmado</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Objetivo
            </label>

            <select
              value={objectiveFilter}
              onChange={(event) =>
                onObjectiveFilterChange(event.target.value as ObjectiveFilter)
              }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="all">Todos</option>
              <option value="conversation">Conversación</option>
              <option value="installation">Instalación</option>
              <option value="maintenance">Mantenimiento</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 border-t border-slate-100 pt-3 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onStatusFilterChange("active")}
              className={getChipClass(statusFilter === "active")}
            >
              Activos
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange("unread")}
              className={getChipClass(statusFilter === "unread")}
            >
              Sin leer
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange("waiting")}
              className={getChipClass(statusFilter === "waiting")}
            >
              En gestión
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange("confirmed")}
              className={getChipClass(statusFilter === "confirmed")}
            >
              Confirmados
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange("manual")}
              className={getChipClass(statusFilter === "manual")}
            >
              Manual
            </button>

            <button
              type="button"
              onClick={() => onStatusFilterChange("archived")}
              className={getChipClass(statusFilter === "archived")}
            >
              Archivados
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <select
              value={dateFilter}
              onChange={(event) =>
                onDateFilterChange(event.target.value as DateFilter)
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:bg-slate-50"
            >
              <option value="all">Fecha: todas</option>
              <option value="today">Hoy</option>
              <option value="week">Próximos 7 días</option>
              <option value="month">Este mes</option>
            </select>

            <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm">
              Ver
              <select
                value={pageSize}
                onChange={(event) =>
                  onPageSizeChange(Number(event.target.value))
                }
                className="bg-transparent text-sm font-semibold outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {mounted && (
              <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => onViewModeChange("list")}
                  className={[
                    "h-7 rounded-md px-3 text-sm font-semibold transition",
                    viewMode === "list"
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  Lista
                </button>

                <button
                  type="button"
                  onClick={() => onViewModeChange("grid")}
                  className={[
                    "h-7 rounded-md px-3 text-sm font-semibold transition",
                    viewMode === "grid"
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  Grid
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onRefreshList}
              disabled={refreshing}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refrescando..." : "Refrescar"}
            </button>

            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export type { RiskFilter, ObjectiveFilter, DateFilter };
