"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";

import type {
  OperationalZoneFilter,
  OperationalZoneOption,
  SortType,
  StatusFilter,
  WhatsAppFilter,
} from "@/app/clients/config/clientsPageConfig";

type ClientListFiltersProps = {
  search: string;
  statusFilter: StatusFilter;
  whatsFilter: WhatsAppFilter;
  operationalZoneFilter: OperationalZoneFilter;
  operationalZones: OperationalZoneOption[];
  sort: SortType;
  resultText?: string;
  rightContent?: ReactNode;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onWhatsFilterChange: (value: WhatsAppFilter) => void;
  onOperationalZoneFilterChange: (value: OperationalZoneFilter) => void;
  onSortChange: (value: SortType) => void;
};

const controlClass =
  "h-9 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

export function ClientListFilters({
  search,
  statusFilter,
  whatsFilter,
  operationalZoneFilter,
  operationalZones,
  sort,
  resultText,
  rightContent,
  onSearchChange,
  onStatusFilterChange,
  onWhatsFilterChange,
  onOperationalZoneFilterChange,
  onSortChange,
}: ClientListFiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(300px,1fr)_145px_165px_190px_145px_auto] xl:items-center">
        <div className="relative md:col-span-2 xl:col-span-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar clientes..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as StatusFilter)
          }
          className={controlClass}
        >
          <option value="all">Estado: Todos</option>
          <option value="ACTIVE">Estado: Activos</option>
          <option value="PROSPECT">Estado: Prospectos</option>
          <option value="ON_HOLD">Estado: En espera</option>
          <option value="INACTIVE">Estado: Inactivos</option>
        </select>

        <select
          value={whatsFilter}
          onChange={(event) =>
            onWhatsFilterChange(event.target.value as WhatsAppFilter)
          }
          className={controlClass}
        >
          <option value="all">WhatsApp: Todos</option>
          <option value="with">Con WhatsApp</option>
          <option value="without">Sin WhatsApp</option>
        </select>

        <select
          value={operationalZoneFilter}
          onChange={(event) =>
            onOperationalZoneFilterChange(
              event.target.value as OperationalZoneFilter,
            )
          }
          className={controlClass}
        >
          <option value="all">Zona operativa: Todas</option>

          {operationalZones.map((zone) => (
            <option
              key={zone.operational_zone_id}
              value={zone.operational_zone_id}
            >
              {zone.name}
            </option>
          ))}

          <option value="without">Sin zona operativa</option>
        </select>

        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortType)}
          className={controlClass}
        >
          <option value="name">Nombre</option>
          <option value="recent">Más recientes</option>
        </select>

        <div className="flex flex-wrap items-center justify-end gap-2 md:col-span-2 xl:col-span-1">
          {resultText ? (
            <span className="inline-flex h-9 items-center whitespace-nowrap rounded-md bg-slate-100 px-3 text-xs font-semibold text-slate-600">
              {resultText}
            </span>
          ) : null}

          {rightContent}
        </div>
      </div>
    </section>
  );
}
