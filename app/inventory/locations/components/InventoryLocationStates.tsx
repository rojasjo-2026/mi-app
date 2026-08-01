"use client";

import { AlertTriangle, MapPinOff, RefreshCw } from "lucide-react";

type InventoryLocationLoadingStateProps = {
  rows?: number;
};

export function InventoryLocationLoadingState({
  rows = 5,
}: InventoryLocationLoadingStateProps) {
  return (
    <section
      aria-label="Cargando ubicaciones"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="grid animate-pulse gap-3 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(140px,1fr)_minmax(140px,1fr)_100px]"
          >
            <div>
              <div className="h-4 w-48 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
            </div>

            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="h-4 w-32 rounded bg-slate-100" />
            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

type InventoryLocationErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function InventoryLocationErrorState({
  message,
  onRetry,
}: InventoryLocationErrorStateProps) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full border border-red-200 bg-white text-red-600">
        <AlertTriangle className="size-5" />
      </div>

      <h2 className="mt-4 text-base font-bold text-red-900">
        No fue posible cargar las ubicaciones
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm text-red-700">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
      >
        <RefreshCw className="size-4" />
        Reintentar
      </button>
    </section>
  );
}

type InventoryLocationEmptyStateProps = {
  hasFilters: boolean;
  onCreate: () => void;
  onReset: () => void;
};

export function InventoryLocationEmptyState({
  hasFilters,
  onCreate,
  onReset,
}: InventoryLocationEmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
        <MapPinOff className="size-5" />
      </div>

      <h2 className="mt-4 text-base font-bold text-slate-900">
        {hasFilters
          ? "No hay ubicaciones que coincidan"
          : "Todavía no hay ubicaciones"}
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
        {hasFilters
          ? "Modificá los filtros o restablecé la búsqueda para consultar otros registros."
          : "Creá la primera ubicación para comenzar a registrar existencias y movimientos."}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {hasFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Restablecer filtros
          </button>
        ) : null}

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Nueva ubicación
        </button>
      </div>
    </section>
  );
}
