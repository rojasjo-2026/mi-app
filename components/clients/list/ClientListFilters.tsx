"use client";

type StatusFilter = "all" | "ACTIVE" | "PROSPECT" | "ON_HOLD" | "INACTIVE";
type WhatsAppFilter = "all" | "with" | "without";
type SortType = "name" | "recent";

type ClientListFiltersProps = {
  search: string;
  statusFilter: StatusFilter;
  whatsFilter: WhatsAppFilter;
  sort: SortType;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onWhatsFilterChange: (value: WhatsAppFilter) => void;
  onSortChange: (value: SortType) => void;
};

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400";

export function ClientListFilters({
  search,
  statusFilter,
  whatsFilter,
  sort,
  onSearchChange,
  onStatusFilterChange,
  onWhatsFilterChange,
  onSortChange,
}: ClientListFiltersProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_180px_190px_180px] xl:items-end">
        <div>
          <label htmlFor="client-search" className={labelClass}>
            Buscar cliente
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              🔎
            </span>

            <input
              id="client-search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Nombre, teléfono, email o ubicación..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status-filter" className={labelClass}>
            Estado
          </label>

          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as StatusFilter)
            }
            className={selectClass}
          >
            <option value="all">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="PROSPECT">Prospectos</option>
            <option value="ON_HOLD">En espera</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>

        <div>
          <label htmlFor="whatsapp-filter" className={labelClass}>
            WhatsApp
          </label>

          <select
            id="whatsapp-filter"
            value={whatsFilter}
            onChange={(e) =>
              onWhatsFilterChange(e.target.value as WhatsAppFilter)
            }
            className={selectClass}
          >
            <option value="all">Todos</option>
            <option value="with">Con WhatsApp</option>
            <option value="without">Sin WhatsApp</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort" className={labelClass}>
            Ordenar por
          </label>

          <select
            id="sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortType)}
            className={selectClass}
          >
            <option value="name">Nombre</option>
            <option value="recent">Más recientes</option>
          </select>
        </div>
      </div>
    </section>
  );
}
