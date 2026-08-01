import { Plus, RefreshCw, Scale } from "lucide-react";

type InventoryUnitHeaderProps = {
  loading: boolean;
  totalItems: number;
  onRefresh: () => void;
  onCreate: () => void;
};

export default function InventoryUnitHeader({
  loading,
  totalItems,
  onRefresh,
  onCreate,
}: InventoryUnitHeaderProps) {
  return (
    <header className="rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                Unidades
              </h1>

              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {totalItems} {totalItems === 1 ? "unidad" : "unidades"}
              </span>
            </div>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Administrá las unidades utilizadas para registrar cantidades,
              existencias, costos y movimientos de productos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3.5 text-sm font-semibold text-white transition hover:border-blue-700 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva unidad
          </button>
        </div>
      </div>
    </header>
  );
}
