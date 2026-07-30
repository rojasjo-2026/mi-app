import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Package,
} from "lucide-react";

import type { InventoryStockListData } from "../types";

import {
  formatInventoryStockMoney,
  formatInventoryStockQuantity,
  getInventoryAvailabilityTone,
  getInventoryUnitLabel,
  getInventoryVariantLabel,
} from "../utils/inventoryStockUi";

type InventoryStockTableProps = {
  data: InventoryStockListData;
  loading: boolean;
  selectedBalanceId: string | null;
  locale: string;
  currency: string;

  onSelect: (inventoryStockBalanceId: string) => void;

  onPageChange: (page: number) => void;
};

export default function InventoryStockTable({
  data,
  loading,
  selectedBalanceId,
  locale,
  currency,
  onSelect,
  onPageChange,
}: InventoryStockTableProps) {
  const { pagination } = data;

  const firstVisible =
    data.items.length === 0
      ? 0
      : (pagination.page - 1) * pagination.page_size + 1;

  const lastVisible = Math.min(
    pagination.page * pagination.page_size,
    pagination.total_items,
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="relative min-w-0 overflow-x-auto">
        {loading ? (
          <div className="absolute right-4 top-3 z-20 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Actualizando
          </div>
        ) : null}

        <table className="min-w-[1080px] w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Producto
              </th>

              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Ubicación
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Existencia
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Comprometido
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Disponible
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Valor
              </th>
            </tr>
          </thead>

          <tbody
            className={[
              "divide-y divide-slate-100 transition-opacity",
              loading ? "opacity-60" : "opacity-100",
            ].join(" ")}
          >
            {data.items.map((balance) => {
              const unit = getInventoryUnitLabel(balance);

              const availabilityTone = getInventoryAvailabilityTone(
                balance.available_quantity,
              );

              const selected =
                selectedBalanceId === balance.inventory_stock_balance_id;

              return (
                <tr
                  key={balance.inventory_stock_balance_id}
                  role="button"
                  tabIndex={0}
                  aria-selected={selected}
                  onClick={() => onSelect(balance.inventory_stock_balance_id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();

                      onSelect(balance.inventory_stock_balance_id);
                    }
                  }}
                  className={[
                    "cursor-pointer outline-none transition focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-100",
                    selected ? "bg-blue-50/70" : "bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                        <Package className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="max-w-[300px] truncate text-sm font-semibold text-slate-950">
                            {balance.product.name}
                          </p>

                          {!balance.product.is_active ||
                          !balance.variant.is_active ? (
                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              Inactivo
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 max-w-[320px] truncate text-xs text-slate-500">
                          {getInventoryVariantLabel(balance)} ·{" "}
                          {balance.stock_unit.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />

                      <div className="min-w-0">
                        <p className="max-w-[240px] truncate text-sm font-semibold text-slate-700">
                          {balance.location.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {balance.location.location_code}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-800">
                      {formatInventoryStockQuantity(
                        balance.quantity_on_hand,
                        locale,
                        balance.stock_unit.decimal_scale,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">{unit}</p>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-semibold tabular-nums text-amber-700">
                      {formatInventoryStockQuantity(
                        balance.quantity_reserved,
                        locale,
                        balance.stock_unit.decimal_scale,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">{unit}</p>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span
                      className={[
                        "inline-flex min-w-20 justify-end rounded-md border px-2 py-1 text-sm font-semibold tabular-nums",
                        availabilityTone.textClassName,
                        availabilityTone.backgroundClassName,
                        availabilityTone.borderClassName,
                      ].join(" ")}
                    >
                      {formatInventoryStockQuantity(
                        balance.available_quantity,
                        locale,
                        balance.stock_unit.decimal_scale,
                      )}
                    </span>

                    <p className="mt-1 text-xs text-slate-400">{unit}</p>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-800">
                      {formatInventoryStockMoney(
                        balance.inventory_value,
                        locale,
                        currency,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Costo promedio{" "}
                      {formatInventoryStockMoney(
                        balance.average_unit_cost,
                        locale,
                        currency,
                      )}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-500">
          Mostrando {firstVisible}–{lastVisible} de {pagination.total_items}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.has_previous_page || loading}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Anterior
          </button>

          <span className="min-w-24 text-center text-xs font-semibold tabular-nums text-slate-500">
            Página {pagination.page} de {Math.max(pagination.total_pages, 1)}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.has_next_page || loading}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  );
}
