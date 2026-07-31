"use client";

import {
  LoaderCircle,
  PackageSearch,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

type InventoryProductStatesProps = {
  initialLoading: boolean;
  error: string;
  itemCount: number;
  onRetry: () => void;
};

export default function InventoryProductStates({
  initialLoading,
  error,
  itemCount,
  onRetry,
}: InventoryProductStatesProps) {
  if (initialLoading) {
    return (
      <section className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <LoaderCircle
          className="h-8 w-8 animate-spin text-blue-600"
          aria-hidden="true"
        />

        <h2 className="mt-4 text-base font-bold text-slate-900">
          Cargando productos
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Consultando el catálogo de inventario.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-6 py-12 text-center">
        <TriangleAlert className="h-8 w-8 text-rose-600" aria-hidden="true" />

        <h2 className="mt-4 text-base font-bold text-rose-900">
          No se pudieron cargar los productos
        </h2>

        <p className="mt-1 max-w-xl text-sm leading-6 text-rose-700">{error}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reintentar
        </button>
      </section>
    );
  }

  if (itemCount === 0) {
    return (
      <section className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <PackageSearch className="h-9 w-9 text-slate-400" aria-hidden="true" />

        <h2 className="mt-4 text-base font-bold text-slate-900">
          No se encontraron productos
        </h2>

        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
          Ajustá la búsqueda o limpiá los filtros para consultar otros
          productos.
        </p>
      </section>
    );
  }

  return null;
}
