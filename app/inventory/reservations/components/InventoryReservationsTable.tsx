"use client";

import { ChevronRight } from "lucide-react";

import type { InventoryReservationListData } from "../types";

import {
  formatInventoryDate,
  formatInventoryQuantity,
  getExpirationLabel,
  getPrimaryLocationLabel,
  getPrimaryProductLabel,
  getReferenceLabel,
  getReservationStatusClasses,
  getReservationStatusLabel,
} from "../utils/inventoryReservationUi";

const GRID_TEMPLATE =
  "minmax(230px,1.3fr) minmax(180px,1fr) minmax(220px,1.2fr) minmax(180px,1fr) 120px 120px 155px 155px 155px 44px";

type InventoryReservationsTableProps = {
  data: InventoryReservationListData;
  loading: boolean;
  selectedReservationId: string | null;
  locale: string;
  onSelect: (inventoryReservationId: string) => void;
  onPageChange: (page: number) => void;
};

export default function InventoryReservationsTable({
  data,
  loading,
  selectedReservationId,
  locale,
  onSelect,
  onPageChange,
}: InventoryReservationsTableProps) {
  const { items, pagination } = data;

  const totalPages = Math.max(1, pagination.total_pages);

  const currentPage = Math.min(Math.max(1, pagination.page), totalPages);

  const firstItem =
    pagination.total_items === 0
      ? 0
      : (currentPage - 1) * pagination.page_size + 1;

  const lastItem = Math.min(
    currentPage * pagination.page_size,
    pagination.total_items,
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
      <div className="relative overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-auto">
        {loading ? (
          <div className="sticky left-0 top-0 z-40 h-0">
            <div className="h-0.5 w-full overflow-hidden bg-blue-100">
              <div className="h-full w-1/3 animate-pulse bg-blue-500" />
            </div>
          </div>
        ) : null}

        <div
          style={{
            minWidth: 1540,
            width: "100%",
          }}
        >
          <div
            role="row"
            style={{
              gridTemplateColumns: GRID_TEMPLATE,
            }}
            className="sticky top-0 z-30 grid border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400"
          >
            <div className="px-4 py-3">Reserva</div>

            <div className="px-3 py-3">Referencia</div>

            <div className="px-3 py-3">Producto</div>

            <div className="px-3 py-3">Ubicacion</div>

            <div className="px-3 py-3 text-right">Comprometido</div>

            <div className="px-3 py-3 text-right">Consumido</div>

            <div className="px-3 py-3">Estado</div>

            <div className="px-3 py-3">Vencimiento</div>

            <div className="px-3 py-3">Actualizacion</div>

            <div aria-hidden="true" />
          </div>

          <ul>
            {items.map((reservation) => {
              const product = getPrimaryProductLabel(reservation);

              const location = getPrimaryLocationLabel(reservation);

              const reference = getReferenceLabel(
                reservation.reference_type,
                reservation.reference_number,
                reservation.reference_id,
              );

              const expiration = getExpirationLabel(
                reservation.expiration,
                reservation.expires_at,
                locale,
              );

              const selected =
                reservation.inventory_reservation_id === selectedReservationId;

              return (
                <li
                  key={reservation.inventory_reservation_id}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      onSelect(reservation.inventory_reservation_id)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(reservation.inventory_reservation_id);
                      }
                    }}
                    aria-pressed={selected}
                    style={{
                      gridTemplateColumns: GRID_TEMPLATE,
                    }}
                    className={[
                      "grid w-full cursor-pointer items-center text-left transition focus-visible:relative focus-visible:z-20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-100",
                      selected ? "bg-blue-50/70" : "bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="min-w-0 px-4 py-3.5">
                      <p
                        title={reservation.reservation_number}
                        className="truncate text-sm font-semibold text-slate-950"
                      >
                        {reservation.reservation_number}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {reservation.line_count} linea
                        {reservation.line_count === 1 ? "" : "s"} Â·{" "}
                        {reservation.event_count} evento
                        {reservation.event_count === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="min-w-0 px-3 py-3.5">
                      <p
                        title={reference.title}
                        className="truncate text-sm font-medium text-slate-800"
                      >
                        {reference.title}
                      </p>

                      <p
                        title={reference.helper}
                        className="mt-1 truncate text-xs text-slate-400"
                      >
                        {reference.helper}
                      </p>
                    </div>

                    <div className="min-w-0 px-3 py-3.5">
                      <p
                        title={product.title}
                        className="truncate text-sm font-medium text-slate-800"
                      >
                        {product.title}
                      </p>

                      <p
                        title={product.helper}
                        className="mt-1 truncate text-xs text-slate-400"
                      >
                        {product.helper || "Variante principal"}
                      </p>
                    </div>

                    <div className="min-w-0 px-3 py-3.5">
                      <p
                        title={location.title}
                        className="truncate text-sm font-medium text-slate-800"
                      >
                        {location.title}
                      </p>

                      <p
                        title={location.helper}
                        className="mt-1 truncate text-xs text-slate-400"
                      >
                        {location.helper}
                      </p>
                    </div>

                    <div className="px-3 py-3.5 text-right">
                      <p className="text-sm font-semibold tabular-nums text-slate-950">
                        {formatInventoryQuantity(
                          reservation.quantity_totals.reserved,
                          locale,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        de{" "}
                        {formatInventoryQuantity(
                          reservation.quantity_totals.requested,
                          locale,
                        )}
                      </p>
                    </div>

                    <div className="px-3 py-3.5 text-right">
                      <p className="text-sm font-semibold tabular-nums text-slate-950">
                        {formatInventoryQuantity(
                          reservation.quantity_totals.consumed,
                          locale,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Liberado{" "}
                        {formatInventoryQuantity(
                          reservation.quantity_totals.released,
                          locale,
                        )}
                      </p>
                    </div>

                    <div className="px-3 py-3.5">
                      <span
                        className={[
                          "inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getReservationStatusClasses(reservation.status),
                        ].join(" ")}
                      >
                        {getReservationStatusLabel(reservation.status)}
                      </span>
                    </div>

                    <div className="min-w-0 px-3 py-3.5">
                      <p
                        className={[
                          "truncate text-sm font-semibold",
                          expiration.className,
                        ].join(" ")}
                      >
                        {expiration.label}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {[
                          "CONSUMED",
                          "RELEASED",
                          "EXPIRED",
                          "CANCELLED",
                        ].includes(reservation.status)
                          ? "No aplica al estado final"
                          : expiration.helper}
                      </p>
                    </div>

                    <div className="min-w-0 px-3 py-3.5">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {formatInventoryDate(reservation.updated_at, locale)}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Ultima actividad
                      </p>
                    </div>

                    <div className="flex items-center justify-center pr-3 text-slate-300">
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-500">
          Mostrando{" "}
          <span className="font-semibold text-slate-700">
            {firstItem}-{lastItem}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-slate-700">
            {pagination.total_items}
          </span>{" "}
          reservas Â· Pagina {currentPage} de {totalPages}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
            className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || loading}
            className="h-9 cursor-pointer rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </footer>
    </section>
  );
}
