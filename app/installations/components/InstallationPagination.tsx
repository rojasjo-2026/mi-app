"use client";

import type { Dispatch, SetStateAction } from "react";
import { PAGE_SIZE_OPTIONS } from "../config/installationsPageConfig";

type InstallationPaginationProps = {
  pageSize: number;
  safeCurrentPage: number;
  totalPages: number;
  loading: boolean;
  onPageSizeChange: (value: number) => void;
  setCurrentPage: Dispatch<SetStateAction<number>>;
};

export function InstallationPagination({
  pageSize,
  safeCurrentPage,
  totalPages,
  loading,
  onPageSizeChange,
  setCurrentPage,
}: InstallationPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-slate-500">
        Página {safeCurrentPage} de {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
          Ver
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="bg-transparent text-sm font-bold outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={safeCurrentPage <= 1 || loading}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>

        <button
          type="button"
          onClick={() =>
            setCurrentPage((page) => Math.min(totalPages, page + 1))
          }
          disabled={safeCurrentPage >= totalPages || loading}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
