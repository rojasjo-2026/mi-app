"use client";

import { useState } from "react";

type FilterState = {
  dateRange: string;
  client: string;
  status: string;
  operationalZone: string;
  technician: string;
  serviceType: string;
  paymentStatus: string;
};

const initialFilters: FilterState = {
  dateRange: "30",
  client: "",
  status: "all",
  operationalZone: "all",
  technician: "all",
  serviceType: "all",
  paymentStatus: "all",
};

export default function ReportsFilters() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  function updateFilter(key: keyof FilterState, value: string) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  function applyFilters() {
    console.log("Filtros de reportes preparados:", filters);
  }

  function clearFilters() {
    setFilters(initialFilters);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Filtros globales
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Prepara la vista para analizar reportes por fecha, cliente, zona,
            técnico, servicio y estado financiero.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Limpiar filtros
          </button>

          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">
            Rango de fechas
          </span>
          <select
            value={filters.dateRange}
            onChange={(event) => updateFilter("dateRange", event.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="month">Mes actual</option>
            <option value="year">Año actual</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">Cliente</span>
          <input
            value={filters.client}
            onChange={(event) => updateFilter("client", event.target.value)}
            placeholder="Buscar cliente"
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">Estado</span>
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <option value="active">Activo</option>
            <option value="pending">Pendiente</option>
            <option value="completed">Completado</option>
            <option value="overdue">Vencido</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">
            Zona operativa
          </span>
          <select
            value={filters.operationalZone}
            onChange={(event) =>
              updateFilter("operationalZone", event.target.value)
            }
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todas</option>
            <option value="north">Zona norte</option>
            <option value="south">Zona sur</option>
            <option value="central">Zona central</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">Técnico</span>
          <select
            value={filters.technician}
            onChange={(event) => updateFilter("technician", event.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <option value="assigned">Asignado</option>
            <option value="unassigned">Sin asignar</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">
            Tipo de servicio
          </span>
          <select
            value={filters.serviceType}
            onChange={(event) =>
              updateFilter("serviceType", event.target.value)
            }
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <option value="installation">Instalación</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="inspection">Revisión</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">
            Estado de pago
          </span>
          <select
            value={filters.paymentStatus}
            onChange={(event) =>
              updateFilter("paymentStatus", event.target.value)
            }
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="overdue">Vencido</option>
          </select>
        </label>
      </div>
    </section>
  );
}
