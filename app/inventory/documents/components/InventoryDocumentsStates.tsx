import { AlertTriangle, FileText, RefreshCw, SearchX } from "lucide-react";

export function InventoryDocumentsLoadingState() {
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

type InventoryDocumentsErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function InventoryDocumentsErrorState({
  message,
  onRetry,
}: InventoryDocumentsErrorStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-red-200 bg-white px-6 py-12 text-center shadow-sm">
      <AlertTriangle className="h-7 w-7 text-red-600" aria-hidden="true" />

      <h2 className="mt-4 text-base font-semibold text-slate-950">
        No fue posible cargar las operaciones
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

type InventoryDocumentsEmptyStateProps = {
  filtered: boolean;
  onClear: () => void;
};

export function InventoryDocumentsEmptyState({
  filtered,
  onClear,
}: InventoryDocumentsEmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      {filtered ? (
        <SearchX className="h-7 w-7 text-slate-500" aria-hidden="true" />
      ) : (
        <FileText className="h-7 w-7 text-slate-500" aria-hidden="true" />
      )}

      <h2 className="mt-4 text-base font-semibold text-slate-950">
        {filtered
          ? "No hay operaciones para estos filtros"
          : "No existen operaciones de inventario"}
      </h2>

      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {filtered
          ? "Modifica la búsqueda o limpia los filtros."
          : "Las operaciones aparecerán cuando se registre una entrada, salida, transferencia, ajuste o devolución."}
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
