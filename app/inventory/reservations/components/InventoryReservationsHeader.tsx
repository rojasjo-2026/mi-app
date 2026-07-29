"use client";

import { RefreshCw } from "lucide-react";

type InventoryReservationsHeaderProps = {
  loading: boolean;
  totalItems: number;
  onRefresh: () => void;
};

export default function InventoryReservationsHeader({
  loading,
  totalItems,
  onRefresh,
}: InventoryReservationsHeaderProps) {
  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
          Inventario
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Reservas de inventario
        </h1>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Controla las existencias comprometidas, su consumo, liberacion y
          vencimiento desde un unico espacio operativo.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 shadow-sm sm:block">
          <span className="font-semibold text-slate-950">{totalItems}</span>{" "}
          reserva{totalItems === 1 ? "" : "s"}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")}
            aria-hidden="true"
          />

          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
    </header>
  );
}
