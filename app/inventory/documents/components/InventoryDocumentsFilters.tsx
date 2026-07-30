import { RotateCcw, Search } from "lucide-react";

import type {
  InventoryDocumentFilters,
  InventoryDocumentStatus,
  InventoryDocumentType,
} from "../types";

import {
  formatInventoryDocumentStatus,
  formatInventoryDocumentType,
} from "../utils/inventoryDocumentUi";

const DOCUMENT_TYPES: InventoryDocumentType[] = [
  "OPENING_BALANCE",
  "RECEIPT",
  "ISSUE",
  "TRANSFER",
  "ADJUSTMENT_INCREASE",
  "ADJUSTMENT_DECREASE",
  "RETURN_IN",
  "RETURN_OUT",
];

const DOCUMENT_STATUSES: InventoryDocumentStatus[] = [
  "DRAFT",
  "POSTED",
  "IN_TRANSIT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
  "REVERSED",
];

type InventoryDocumentsFiltersProps = {
  search: string;
  filters: InventoryDocumentFilters;
  resultText: string;
  clearDisabled: boolean;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: InventoryDocumentFilters) => void;
  onClear: () => void;
};

export default function InventoryDocumentsFilters({
  search,
  filters,
  resultText,
  clearDisabled,
  onSearchChange,
  onFiltersChange,
  onClear,
}: InventoryDocumentsFiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid min-w-0 gap-2 xl:grid-cols-[minmax(260px,1fr)_190px_190px_155px_155px_auto]">
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar número, referencia o notas..."
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <select
          value={filters.documentType}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              documentType: event.target
                .value as InventoryDocumentFilters["documentType"],
            })
          }
          aria-label="Filtrar por tipo de operación"
          className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
        >
          <option value="ALL">Todos los tipos</option>

          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatInventoryDocumentType(type)}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as InventoryDocumentFilters["status"],
            })
          }
          aria-label="Filtrar por estado"
          className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
        >
          <option value="ALL">Todos los estados</option>

          {DOCUMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatInventoryDocumentStatus(status)}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.dateFrom}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              dateFrom: event.target.value,
            })
          }
          aria-label="Fecha inicial"
          className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
        />

        <input
          type="date"
          value={filters.dateTo}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              dateTo: event.target.value,
            })
          }
          aria-label="Fecha final"
          className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
        />

        <button
          type="button"
          onClick={onClear}
          disabled={clearDisabled}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Limpiar
        </button>
      </div>

      <p className="mt-2 text-xs font-medium text-slate-400">{resultText}</p>
    </section>
  );
}
