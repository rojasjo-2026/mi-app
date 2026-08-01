import { AlertTriangle, LoaderCircle, Tags } from "lucide-react";

type InventoryCategoryLoadingStateProps = {
  message?: string;
};

export function InventoryCategoryLoadingState({
  message = "Cargando categorías…",
}: InventoryCategoryLoadingStateProps) {
  return (
    <section className="flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-10 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <LoaderCircle
          className="h-7 w-7 animate-spin text-blue-600"
          aria-hidden="true"
        />

        <p className="mt-3 text-sm font-semibold text-slate-700">{message}</p>
      </div>
    </section>
  );
}

type InventoryCategoryErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export function InventoryCategoryErrorState({
  message,
  onRetry,
}: InventoryCategoryErrorStateProps) {
  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50 px-6 py-8 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>

      <h2 className="mt-4 text-base font-bold text-rose-900">
        No se pudieron cargar las categorías
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-rose-700">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
      >
        Intentar nuevamente
      </button>
    </section>
  );
}

type InventoryCategoryEmptyStateProps = {
  hasFilters: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
};

export function InventoryCategoryEmptyState({
  hasFilters,
  onCreate,
  onClearFilters,
}: InventoryCategoryEmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
        <Tags className="h-5 w-5" aria-hidden="true" />
      </div>

      <h2 className="mt-4 text-base font-bold text-slate-900">
        {hasFilters ? "No encontramos categorías" : "Todavía no hay categorías"}
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        {hasFilters
          ? "Probá modificando la búsqueda o los filtros aplicados."
          : "Creá la primera categoría para comenzar a organizar el catálogo de productos."}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {hasFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        ) : null}

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-semibold text-white transition hover:border-blue-700 hover:bg-blue-700"
        >
          Nueva categoría
        </button>
      </div>
    </section>
  );
}
