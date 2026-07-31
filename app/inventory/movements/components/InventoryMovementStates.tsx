"use client";

import {
  AlertTriangle,
  ArrowLeftRight,
  RefreshCw,
  SearchX,
} from "lucide-react";

export function InventoryMovementLoadingState() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from({
          length: 8,
        }).map((_, index) => (
          <div
            key={index}
            className="grid min-h-16 grid-cols-6 items-center gap-4 px-5 py-3"
          >
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

type InventoryMovementErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function InventoryMovementErrorState({
  message,
  onRetry,
}: InventoryMovementErrorStateProps) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-red-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-slate-950">
        No se pudieron cargar los movimientos
      </h2>

      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}

type InventoryMovementEmptyStateProps = {
  filtered: boolean;
  onClear: () => void;
};

export function InventoryMovementEmptyState({
  filtered,
  onClear,
}: InventoryMovementEmptyStateProps) {
  const Icon = filtered ? SearchX : ArrowLeftRight;

  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <h2 className="mt-4 text-lg font-semibold text-slate-950">
        {filtered
          ? "No hay movimientos para estos filtros"
          : "Todavía no existen movimientos"}
      </h2>

      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {filtered
          ? "Modificá la búsqueda, las fechas o el tipo de movimiento para consultar otros registros."
          : "Los movimientos aparecerán cuando se publiquen operaciones de inventario."}
      </p>

      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
