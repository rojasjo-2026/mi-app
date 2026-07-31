"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  Package,
} from "lucide-react";

import type { KeyboardEvent } from "react";

import type { InventoryMovement, InventoryMovementListData } from "../types";

import {
  formatInventoryMovementDateTime,
  formatInventoryMovementMoney,
  formatInventoryMovementQuantity,
  getInventoryDocumentTypeLabel,
  getInventoryMovementBadgeClass,
  getInventoryMovementDirection,
  getInventoryMovementLabel,
  getInventoryMovementVariantLabel,
} from "../utils/inventoryMovementUi";

type InventoryMovementTableProps = {
  data: InventoryMovementListData;
  loading: boolean;
  selectedMovementId: string | null;
  locale: string;
  currency: string;
  onSelect: (movementId: string) => void;
  onPageChange: (page: number) => void;
};

function MovementQuantity({
  movement,
  locale,
}: {
  movement: InventoryMovement;
  locale: string;
}) {
  const direction = getInventoryMovementDirection(movement);

  const quantity =
    direction === "IN"
      ? movement.quantity_in
      : direction === "OUT"
        ? movement.quantity_out
        : movement.quantity_delta;

  const decimalScale = movement.stock_unit.decimal_scale;

  if (direction === "IN") {
    return (
      <div className="flex items-center justify-end gap-2 text-emerald-700">
        <ArrowDownToLine className="h-4 w-4 shrink-0" aria-hidden="true" />

        <span className="font-semibold tabular-nums">
          +{formatInventoryMovementQuantity(quantity, locale, decimalScale)}
        </span>
      </div>
    );
  }

  if (direction === "OUT") {
    return (
      <div className="flex items-center justify-end gap-2 text-amber-700">
        <ArrowUpFromLine className="h-4 w-4 shrink-0" aria-hidden="true" />

        <span className="font-semibold tabular-nums">
          -{formatInventoryMovementQuantity(quantity, locale, decimalScale)}
        </span>
      </div>
    );
  }

  return (
    <div className="text-right font-semibold tabular-nums text-slate-600">
      {formatInventoryMovementQuantity(quantity, locale, decimalScale)}
    </div>
  );
}

function MovementValue({
  movement,
  locale,
  currency,
}: {
  movement: InventoryMovement;
  locale: string;
  currency: string;
}) {
  const direction = getInventoryMovementDirection(movement);

  const value =
    direction === "IN"
      ? movement.value_in
      : direction === "OUT"
        ? movement.value_out
        : movement.total_cost_delta;

  return (
    <div
      className={[
        "text-right font-semibold tabular-nums",
        direction === "IN"
          ? "text-emerald-700"
          : direction === "OUT"
            ? "text-amber-700"
            : "text-slate-700",
      ].join(" ")}
    >
      {direction === "IN" ? "+" : direction === "OUT" ? "-" : ""}
      {formatInventoryMovementMoney(value, locale, currency)}
    </div>
  );
}

export default function InventoryMovementTable({
  data,
  loading,
  selectedMovementId,
  locale,
  currency,
  onSelect,
  onPageChange,
}: InventoryMovementTableProps) {
  const {
    page,
    page_size: pageSize,
    total_items: totalItems,
    total_pages: totalPages,
    has_previous_page: hasPreviousPage,
    has_next_page: hasNextPage,
  } = data.pagination;

  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;

  const lastItem = Math.min(page * pageSize, totalItems);

  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    movementId: string,
  ) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    onSelect(movementId);
  }

  return (
    <section
      className={[
        "min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        loading ? "opacity-70" : "",
      ].join(" ")}
      aria-busy={loading}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Fecha
              </th>

              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Movimiento
              </th>

              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Producto
              </th>

              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Ubicación
              </th>

              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Operación
              </th>

              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Cantidad
              </th>

              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Valor
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.items.map((movement) => {
              const selected =
                movement.inventory_movement_id === selectedMovementId;

              return (
                <tr
                  key={movement.inventory_movement_id}
                  role="button"
                  tabIndex={0}
                  aria-selected={selected}
                  onClick={() => onSelect(movement.inventory_movement_id)}
                  onKeyDown={(event) =>
                    handleRowKeyDown(event, movement.inventory_movement_id)
                  }
                  className={[
                    "cursor-pointer outline-none transition",
                    selected ? "bg-blue-50" : "bg-white hover:bg-slate-50",
                    "focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400",
                  ].join(" ")}
                >
                  <td className="whitespace-nowrap px-5 py-4 align-top">
                    <p className="text-sm font-medium text-slate-800">
                      {formatInventoryMovementDateTime(
                        movement.movement_at,
                        locale,
                      )}
                    </p>

                    <p className="mt-1 max-w-48 truncate text-xs text-slate-400">
                      {movement.created_by || "Usuario no registrado"}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <span
                      className={[
                        "inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold",
                        getInventoryMovementBadgeClass(movement),
                      ].join(" ")}
                    >
                      {getInventoryMovementLabel(movement.movement_type)}
                    </span>

                    {movement.reversal_of_movement_id ||
                    movement.reversal_movement_id ? (
                      <p className="mt-2 text-xs font-medium text-violet-600">
                        Relacionado con reversión
                      </p>
                    ) : null}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="flex max-w-72 items-start gap-2.5">
                      <Package
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {movement.product.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {getInventoryMovementVariantLabel(movement)}
                          {" · "}
                          {movement.stock_unit.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="flex max-w-56 items-start gap-2.5">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {movement.location.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {movement.location.location_code}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="flex max-w-72 items-start gap-2.5">
                      <FileText
                        className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {movement.document.document_number}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {getInventoryDocumentTypeLabel(
                            movement.document.document_type,
                          )}
                          {" · Línea "}
                          {movement.document_line.line_number}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 align-top">
                    <MovementQuantity movement={movement} locale={locale} />
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 align-top">
                    <MovementValue
                      movement={movement}
                      locale={locale}
                      currency={currency}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Mostrando{" "}
          <span className="font-semibold text-slate-700">{firstItem}</span>
          {" – "}
          <span className="font-semibold text-slate-700">{lastItem}</span>
          {" de "}
          <span className="font-semibold text-slate-700">{totalItems}</span>
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={loading || !hasPreviousPage}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Anterior
          </button>

          <span className="min-w-24 text-center text-sm font-medium tabular-nums text-slate-600">
            Página {page} de {Math.max(totalPages, 1)}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={loading || !hasNextPage}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  );
}
