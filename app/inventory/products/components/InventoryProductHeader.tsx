"use client";

import { Package, Plus, RefreshCw } from "lucide-react";

type InventoryProductHeaderProps = {
  loading: boolean;
  totalItems: number;
  onRefresh: () => void;
  onCreate?: () => void;
};

export default function InventoryProductHeader({
  loading,
  totalItems,
  onRefresh,
  onCreate,
}: InventoryProductHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Package className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
            Catálogo de inventario
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Productos
          </h1>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Administrá los artículos, servicios, repuestos, variantes y reglas
            generales utilizadas por las operaciones de inventario.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right">
          <p className="text-xs font-medium text-slate-500">
            Productos encontrados
          </p>

          <p className="text-lg font-bold text-slate-950">{totalItems}</p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")}
            aria-hidden="true"
          />
          Actualizar
        </button>

        <button
          type="button"
          onClick={onCreate}
          disabled={!onCreate || loading}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo producto
        </button>
      </div>
    </header>
  );
}
