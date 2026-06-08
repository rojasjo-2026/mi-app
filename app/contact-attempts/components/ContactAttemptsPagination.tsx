"use client";

type ContactAttemptsPaginationProps = {
  pageStartIndex: number;
  pageEndIndex: number;
  totalItems: number;
  safeCurrentPage: number;
  totalPages: number;
  refreshing: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function ContactAttemptsPagination({
  pageStartIndex,
  pageEndIndex,
  totalItems,
  safeCurrentPage,
  totalPages,
  refreshing,
  onPreviousPage,
  onNextPage,
}: ContactAttemptsPaginationProps) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="font-medium">
        Mostrando{" "}
        <span className="font-semibold text-slate-900">
          {pageStartIndex}-{pageEndIndex}
        </span>{" "}
        de <span className="font-semibold text-slate-900">{totalItems}</span>{" "}
        contactos · Página{" "}
        <span className="font-semibold text-slate-900">{safeCurrentPage}</span>{" "}
        de <span className="font-semibold text-slate-900">{totalPages}</span>
        {refreshing && (
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
            Actualizando...
          </span>
        )}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={safeCurrentPage <= 1 || refreshing}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>

        <button
          type="button"
          onClick={onNextPage}
          disabled={safeCurrentPage >= totalPages || refreshing}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
