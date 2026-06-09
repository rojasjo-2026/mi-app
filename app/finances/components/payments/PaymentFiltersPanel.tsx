import type { RefObject } from "react";
import {
  PAGE_SIZE_OPTIONS,
  STATUS_OPTIONS,
  type OptionalColumnKey,
  type PaymentStatusFilter,
  type VisibleColumns,
} from "./paymentsSectionConfig";
import { ColumnPicker } from "./ColumnPicker";

type PaymentFiltersPanelProps = {
  search: string;
  status: PaymentStatusFilter;
  dateFrom: string;
  dateTo: string;
  pageSize: number;
  isColumnMenuOpen: boolean;
  columnMenuRef: RefObject<HTMLDivElement | null>;
  visibleColumns: VisibleColumns;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: PaymentStatusFilter) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onPageSizeChange: (value: number) => void;
  onToggleColumnMenu: () => void;
  onToggleColumn: (columnKey: OptionalColumnKey) => void;
};

export function PaymentFiltersPanel({
  search,
  status,
  dateFrom,
  dateTo,
  pageSize,
  isColumnMenuOpen,
  columnMenuRef,
  visibleColumns,
  onSearchChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onPageSizeChange,
  onToggleColumnMenu,
  onToggleColumn,
}: PaymentFiltersPanelProps) {
  return (
    <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-3 xl:grid-cols-[1.3fr_220px_160px_160px_150px_145px]">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por cliente, factura, teléfono o servicio..."
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
        />

        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as PaymentStatusFilter)
          }
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFromChange(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          title="Desde"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(event) => onDateToChange(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          title="Hasta"
        />

        <div ref={columnMenuRef} className="relative">
          <button
            type="button"
            onClick={onToggleColumnMenu}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Columnas
          </button>

          <ColumnPicker
            isOpen={isColumnMenuOpen}
            visibleColumns={visibleColumns}
            onToggleColumn={onToggleColumn}
          />
        </div>

        <label className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
          Ver
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="bg-transparent text-sm font-semibold outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
