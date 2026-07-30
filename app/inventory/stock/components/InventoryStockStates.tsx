import { AlertTriangle, Boxes, RefreshCw, SearchX } from "lucide-react";

export function InventoryStockLoadingState() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="space-y-3 p-4">
        {Array.from({
          length: 7,
        }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-md bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}

type InventoryStockErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function InventoryStockErrorState({
  message,
  onRetry,
}: InventoryStockErrorStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-red-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>

      <h2 className="mt-4 text-base font-semibold text-slate-950">
        No fue posible cargar las existencias
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

type InventoryStockEmptyStateProps = {
  filtered: boolean;
  onClear: () => void;
};

export function InventoryStockEmptyState({
  filtered,
  onClear,
}: InventoryStockEmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        {filtered ? (
          <SearchX className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Boxes className="h-5 w-5" aria-hidden="true" />
        )}
      </div>

      <h2 className="mt-4 text-base font-semibold text-slate-950">
        {filtered
          ? "No hay resultados para estos filtros"
          : "No existen balances de inventario"}
      </h2>

      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {filtered
          ? "Modificá la búsqueda o limpiá los filtros para consultar otros balances."
          : "Los balances aparecerán cuando se registren movimientos de inventario."}
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
