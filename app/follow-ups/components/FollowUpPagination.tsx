"use client";

import type { Dispatch, SetStateAction } from "react";

type FollowUpPaginationProps = {
  pageStartIndex: number;
  pageEndIndex: number;
  visibleTotal: number;
  safeCurrentPage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
};

export function FollowUpPagination({
  pageStartIndex,
  pageEndIndex,
  visibleTotal,
  safeCurrentPage,
  totalPages,
  setCurrentPage,
}: FollowUpPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-500">
        Mostrando {pageStartIndex}-{pageEndIndex} de {visibleTotal}{" "}
        mantenimiento
        {visibleTotal === 1 ? "" : "s"} · Página {safeCurrentPage} de{" "}
        {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={safeCurrentPage <= 1}
          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>

        <button
          type="button"
          onClick={() =>
            setCurrentPage((page) => Math.min(totalPages, page + 1))
          }
          disabled={safeCurrentPage >= totalPages}
          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
