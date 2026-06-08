"use client";

import { ChevronDown } from "lucide-react";
import type { RefObject } from "react";
import {
  OPTIONAL_COLUMNS,
  type OptionalColumnKey,
  type VisibleColumns,
} from "../config/installationsPageConfig";

type InstallationColumnMenuProps = {
  isOpen: boolean;
  columnMenuRef: RefObject<HTMLDivElement | null>;
  visibleColumns: VisibleColumns;
  onToggleOpen: () => void;
  onToggleColumn: (columnKey: OptionalColumnKey) => void;
};

export function InstallationColumnMenu({
  isOpen,
  columnMenuRef,
  visibleColumns,
  onToggleOpen,
  onToggleColumn,
}: InstallationColumnMenuProps) {
  return (
    <div ref={columnMenuRef} className="relative">
      <button
        type="button"
        onClick={onToggleOpen}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        Columnas
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Mostrar columnas
          </div>

          <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            Instalación y Acciones siempre permanecen visibles.
          </div>

          <div className="mt-2">
            {OPTIONAL_COLUMNS.map((column) => (
              <label
                key={column.key}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[column.key]}
                  onChange={() => onToggleColumn(column.key)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {column.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
