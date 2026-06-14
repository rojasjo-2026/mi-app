"use client";

import type {
  ReportBuilderMetadata,
  ReportFilters,
  ReportOption,
} from "../types";

type ReportFiltersPanelProps = {
  filters: ReportFilters;
  metadata: ReportBuilderMetadata | null;
  metadataLoading: boolean;
  onFilterChange: (key: keyof ReportFilters, value: string) => void;
  onReset: () => void;
};

function optionLabel(option: ReportOption) {
  if (typeof option.count === "number") {
    return `${option.label} (${option.count})`;
  }

  return option.label;
}

function SelectOptions({ options }: { options?: ReportOption[] }) {
  return (
    <>
      {(options ?? []).map((option) => (
        <option key={option.value} value={option.value}>
          {optionLabel(option)}
        </option>
      ))}
    </>
  );
}

export default function ReportFiltersPanel({
  filters,
  metadata,
  metadataLoading,
  onFilterChange,
  onReset,
}: ReportFiltersPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Filtros
          </p>

          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
            Condiciones del reporte
          </h2>

          {metadataLoading && (
            <p className="mt-1 text-xs font-medium text-slate-400">
              Cargando opciones reales...
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Limpiar
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-slate-500">Buscar</span>
          <input
            value={filters.search}
            onChange={(event) => onFilterChange("search", event.target.value)}
            placeholder="Nombre, teléfono, email..."
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">
            Tipo de cliente
          </span>
          <select
            value={filters.clientType}
            onChange={(event) =>
              onFilterChange("clientType", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <SelectOptions options={metadata?.clientTypes} />
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">Estado</span>
          <select
            value={filters.status}
            onChange={(event) => onFilterChange("status", event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <SelectOptions options={metadata?.clientStatuses} />
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">WhatsApp</span>
          <select
            value={filters.whatsapp}
            onChange={(event) => onFilterChange("whatsapp", event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <SelectOptions options={metadata?.booleanOptions.whatsapp} />
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">
            Auto contacto
          </span>
          <select
            value={filters.autoContact}
            onChange={(event) =>
              onFilterChange("autoContact", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <SelectOptions options={metadata?.booleanOptions.autoContact} />
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">
            Exento de impuestos
          </span>
          <select
            value={filters.taxExempt}
            onChange={(event) =>
              onFilterChange("taxExempt", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <SelectOptions options={metadata?.booleanOptions.taxExempt} />
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">
            Instalaciones
          </span>
          <select
            value={filters.installationStatus}
            onChange={(event) =>
              onFilterChange("installationStatus", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <option value="with">Con instalaciones</option>
            <option value="without">Sin instalaciones</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">
            Facturación pendiente
          </span>
          <select
            value={filters.pendingBilling}
            onChange={(event) =>
              onFilterChange("pendingBilling", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <option value="with">Con saldo pendiente</option>
            <option value="without">Sin saldo pendiente</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">País</span>
          <select
            value={filters.countryCode}
            onChange={(event) =>
              onFilterChange("countryCode", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <SelectOptions options={metadata?.countries} />
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">
            Provincia / Región
          </span>
          <select
            value={filters.adminLevel1}
            onChange={(event) =>
              onFilterChange("adminLevel1", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todas</option>
            <SelectOptions options={metadata?.adminLevel1Options} />
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">
            Cantón / Ciudad
          </span>
          <select
            value={filters.adminLevel2}
            onChange={(event) =>
              onFilterChange("adminLevel2", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <SelectOptions options={metadata?.adminLevel2Options} />
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">
            Distrito / Zona
          </span>
          <select
            value={filters.adminLevel3}
            onChange={(event) =>
              onFilterChange("adminLevel3", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todos</option>
            <SelectOptions options={metadata?.adminLevel3Options} />
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">
            Zona operativa
          </span>
          <select
            value={filters.operationalZoneId}
            onChange={(event) =>
              onFilterChange("operationalZoneId", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todas</option>
            <SelectOptions options={metadata?.operationalZones} />
            {(metadata?.counters.withoutOperationalZoneCount ?? 0) > 0 && (
              <option value="without">
                Sin zona operativa (
                {metadata?.counters.withoutOperationalZoneCount})
              </option>
            )}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">
            Condición de pago
          </span>
          <select
            value={filters.paymentTerm}
            onChange={(event) =>
              onFilterChange("paymentTerm", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todas</option>
            <SelectOptions options={metadata?.paymentTerms} />
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-500">Moneda</span>
          <select
            value={filters.preferredCurrency}
            onChange={(event) =>
              onFilterChange("preferredCurrency", event.target.value)
            }
            className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="all">Todas</option>
            <SelectOptions options={metadata?.currencies} />
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">
              Creado desde
            </span>
            <input
              type="date"
              value={filters.createdFrom}
              onChange={(event) =>
                onFilterChange("createdFrom", event.target.value)
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-500">
              Creado hasta
            </span>
            <input
              type="date"
              value={filters.createdTo}
              onChange={(event) =>
                onFilterChange("createdTo", event.target.value)
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">
              Actualizado desde
            </span>
            <input
              type="date"
              value={filters.updatedFrom}
              onChange={(event) =>
                onFilterChange("updatedFrom", event.target.value)
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-500">
              Actualizado hasta
            </span>
            <input
              type="date"
              value={filters.updatedTo}
              onChange={(event) =>
                onFilterChange("updatedTo", event.target.value)
              }
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </label>
        </div>
      </div>
    </section>
  );
}
