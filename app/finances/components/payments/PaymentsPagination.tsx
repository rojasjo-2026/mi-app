import type { PaginationState } from "./paymentsSectionConfig";
import { getPaginationStartEnd } from "./paymentsSectionUtils";

export function PaymentsPagination({
  pagination,
  loading,
  invoicesLength,
  onPageChange,
}: {
  pagination: PaginationState;
  loading: boolean;
  invoicesLength: number;
  onPageChange: (value: number) => void;
}) {
  const pageRange = getPaginationStartEnd(pagination);
  const totalPages = Math.max(1, pagination.totalPages);
  const safeCurrentPage = Math.min(pagination.page || 1, totalPages);

  return (
    <div className="flex flex-col gap-3 border-x border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-500">
        Mostrando {pageRange.start}-{pageRange.end} de {pagination.totalItems}{" "}
        facturas · Página {safeCurrentPage} de {totalPages}
        {loading && invoicesLength > 0 ? " · Actualizando..." : ""}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage <= 1}
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>

        <button
          type="button"
          onClick={() =>
            onPageChange(Math.min(totalPages, safeCurrentPage + 1))
          }
          disabled={safeCurrentPage >= totalPages}
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
