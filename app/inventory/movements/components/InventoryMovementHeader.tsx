"use client";

import { ArrowLeftRight, RefreshCw } from "lucide-react";

type InventoryMovementHeaderProps = {
  loading: boolean;
  totalItems: number;
  onRefresh: () => void;
};

export default function InventoryMovementHeader({
  loading,
  totalItems,
  onRefresh,
}: InventoryMovementHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Inventario
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Movimientos de inventario
          </h1>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Consultá el historial de entradas, salidas, transferencias, ajustes
            y reversiones registradas en cada ubicación.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Registros
          </p>

          <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">
            {totalItems}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")}
            aria-hidden="true"
          />
          Actualizar
        </button>
      </div>
    </header>
  );
}
