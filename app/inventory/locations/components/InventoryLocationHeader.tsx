"use client";

import { Plus, RefreshCw, Warehouse } from "lucide-react";

type InventoryLocationHeaderProps = {
  loading: boolean;
  totalItems: number;
  onRefresh: () => void;
  onCreate: () => void;
};

export default function InventoryLocationHeader({
  loading,
  totalItems,
  onRefresh,
  onCreate,
}: InventoryLocationHeaderProps) {
  return (
    <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <Warehouse className="size-5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-950">
                Ubicaciones de inventario
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Administrá almacenes, áreas, sucursales y otras ubicaciones
                utilizadas para existencias y movimientos.
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-600">
            {totalItems === 1
              ? "1 ubicación visible"
              : `${totalItems} ubicaciones visibles`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={["size-4", loading ? "animate-spin" : ""].join(" ")}
            />
            Actualizar
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="size-4" />
            Nueva ubicación
          </button>
        </div>
      </div>
    </header>
  );
}
