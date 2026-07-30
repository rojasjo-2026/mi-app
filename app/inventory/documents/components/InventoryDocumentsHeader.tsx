import { FilePlus2, FileText, RefreshCw } from "lucide-react";

type InventoryDocumentsHeaderProps = {
  loading: boolean;
  totalItems: number;
  onCreate: () => void;
  onRefresh: () => void;
};

export default function InventoryDocumentsHeader({
  loading,
  totalItems,
  onCreate,
  onRefresh,
}: InventoryDocumentsHeaderProps) {
  return (
    <header className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Inventario
          </p>

          <h1 className="mt-1 text-xl font-semibold text-slate-950">
            Operaciones de inventario
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Consulta entradas, salidas, transferencias, ajustes y devoluciones.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <div className="mr-1 text-right">
          <p className="text-xs font-medium text-slate-400">
            Operaciones encontradas
          </p>

          <p className="text-lg font-semibold tabular-nums text-slate-950">
            {totalItems}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          Nueva operación
        </button>
      </div>
    </header>
  );
}
