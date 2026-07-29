"use client";

import { AlertCircle, ClipboardList, RotateCcw } from "lucide-react";

export function InventoryReservationsLoadingState() {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="space-y-1 p-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="grid animate-pulse grid-cols-[1.2fr_1fr_1fr_120px] gap-4 border-b border-slate-100 px-3 py-4 last:border-b-0"
          >
            <div className="h-4 rounded bg-slate-100" />
            <div className="h-4 rounded bg-slate-100" />
            <div className="h-4 rounded bg-slate-100" />
            <div className="h-4 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function InventoryReservationsErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <section className="rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>

      <h2 className="mt-4 text-base font-semibold text-slate-950">
        No se pudieron cargar las reservas
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reintentar
      </button>
    </section>
  );
}

type EmptyStateProps = {
  filtered: boolean;
  onClear: () => void;
};

export function InventoryReservationsEmptyState({
  filtered,
  onClear,
}: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <ClipboardList className="h-5 w-5" aria-hidden="true" />
      </div>

      <h2 className="mt-4 text-base font-semibold text-slate-950">
        {filtered ? "No hay reservas que coincidan" : "Todavia no hay reservas"}
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {filtered
          ? "Ajusta los filtros o limpia la busqueda para consultar otros registros."
          : "Las reservas apareceran aqui cuando se creen desde los procesos operativos de inventario."}
      </p>

      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Limpiar filtros
        </button>
      ) : null}
    </section>
  );
}
