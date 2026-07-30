"use client";

import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Scale,
  Warehouse,
  X,
} from "lucide-react";

import { useEffect } from "react";

import type { InventoryStockBalance } from "../types";

import {
  formatInventoryEnumLabel,
  formatInventoryStockDateTime,
  formatInventoryStockMoney,
  formatInventoryStockQuantity,
  getInventoryAvailabilityTone,
  getInventoryUnitLabel,
  getInventoryVariantLabel,
} from "../utils/inventoryStockUi";

type InventoryStockPreviewPanelProps = {
  balanceId: string | null;
  detail: InventoryStockBalance | null;
  loading: boolean;
  error: string;
  locale: string;
  currency: string;
  onClose: () => void;
  onRefresh: () => void;
};

type DetailRowProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

function DetailRow({
  label,
  value,
  valueClassName = "text-slate-800",
}: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>

      <dd
        className={[
          "max-w-[65%] text-right text-sm font-semibold",
          valueClassName,
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function booleanLabel(value: boolean) {
  return value ? "Sí" : "No";
}

export default function InventoryStockPreviewPanel({
  balanceId,
  detail,
  loading,
  error,
  locale,
  currency,
  onClose,
  onRefresh,
}: InventoryStockPreviewPanelProps) {
  useEffect(() => {
    if (!balanceId) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [balanceId, onClose]);

  if (!balanceId) {
    return null;
  }

  const unit = detail ? getInventoryUnitLabel(detail) : "";

  const availabilityTone = detail
    ? getInventoryAvailabilityTone(detail.available_quantity)
    : null;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Cerrar detalle de existencia"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-slate-950/5"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <Boxes className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Existencia seleccionada
            </p>

            <h2 className="mt-1 truncate text-base font-semibold text-slate-950">
              {detail?.product.name || "Cargando balance..."}
            </h2>

            <p className="mt-1 truncate text-xs font-medium text-slate-500">
              {detail ? getInventoryVariantLabel(detail) : balanceId}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <Loader2
                className="h-6 w-6 animate-spin text-blue-600"
                aria-hidden="true"
              />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Cargando existencia...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <AlertTriangle
                className="h-7 w-7 text-red-600"
                aria-hidden="true"
              />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                No fue posible cargar el balance
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">{error}</p>

              <button
                type="button"
                onClick={onRefresh}
                className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Reintentar
              </button>
            </div>
          ) : detail ? (
            <div className="space-y-4 p-5">
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Package
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-slate-950">
                    Producto y variante
                  </h3>
                </div>

                <dl className="mt-3">
                  <DetailRow label="Producto" value={detail.product.name} />

                  <DetailRow
                    label="Variante"
                    value={getInventoryVariantLabel(detail)}
                  />

                  <DetailRow
                    label="Unidad"
                    value={`${detail.stock_unit.name} (${detail.stock_unit.code})`}
                  />

                  <DetailRow
                    label="Tipo de producto"
                    value={formatInventoryEnumLabel(
                      detail.product.product_type,
                    )}
                  />

                  <DetailRow
                    label="Seguimiento"
                    value={formatInventoryEnumLabel(
                      detail.product.tracking_mode,
                    )}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <MapPin
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-slate-950">
                    Ubicación
                  </h3>
                </div>

                <dl className="mt-3">
                  <DetailRow label="Nombre" value={detail.location.name} />

                  <DetailRow
                    label="Código"
                    value={detail.location.location_code}
                  />

                  <DetailRow
                    label="Tipo"
                    value={formatInventoryEnumLabel(
                      detail.location.location_type,
                    )}
                  />

                  <DetailRow
                    label="Permite existencia"
                    value={booleanLabel(detail.location.allows_stock)}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Scale
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-slate-950">
                    Flujo de cantidades
                  </h3>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Existencia
                    </p>

                    <p className="mt-2 text-lg font-semibold tabular-nums text-slate-950">
                      {formatInventoryStockQuantity(
                        detail.quantity_on_hand,
                        locale,
                        detail.stock_unit.decimal_scale,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">{unit}</p>
                  </div>

                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                      Comprometido
                    </p>

                    <p className="mt-2 text-lg font-semibold tabular-nums text-amber-700">
                      {formatInventoryStockQuantity(
                        detail.quantity_reserved,
                        locale,
                        detail.stock_unit.decimal_scale,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-amber-600">{unit}</p>
                  </div>

                  <div
                    className={[
                      "rounded-md border p-3 text-center",
                      availabilityTone?.borderClassName || "border-slate-200",
                      availabilityTone?.backgroundClassName || "bg-slate-50",
                    ].join(" ")}
                  >
                    <p
                      className={[
                        "text-[10px] font-semibold uppercase tracking-wide",
                        availabilityTone?.textClassName || "text-slate-500",
                      ].join(" ")}
                    >
                      Disponible
                    </p>

                    <p
                      className={[
                        "mt-2 text-lg font-semibold tabular-nums",
                        availabilityTone?.textClassName || "text-slate-800",
                      ].join(" ")}
                    >
                      {formatInventoryStockQuantity(
                        detail.available_quantity,
                        locale,
                        detail.stock_unit.decimal_scale,
                      )}
                    </p>

                    <p
                      className={[
                        "mt-1 text-xs",
                        availabilityTone?.textClassName || "text-slate-400",
                      ].join(" ")}
                    >
                      {unit}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Warehouse
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-slate-950">
                    Valoración
                  </h3>
                </div>

                <dl className="mt-3">
                  <DetailRow
                    label="Costo promedio"
                    value={formatInventoryStockMoney(
                      detail.average_unit_cost,
                      locale,
                      currency,
                    )}
                  />

                  <DetailRow
                    label="Valor de inventario"
                    value={formatInventoryStockMoney(
                      detail.inventory_value,
                      locale,
                      currency,
                    )}
                    valueClassName="text-emerald-700"
                  />

                  <DetailRow
                    label="Versión del balance"
                    value={String(detail.version)}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-slate-950">
                    Configuración y auditoría
                  </h3>
                </div>

                <dl className="mt-3">
                  <DetailRow
                    label="Gestiona inventario"
                    value={booleanLabel(detail.product.manages_stock)}
                  />

                  <DetailRow
                    label="Permite negativo"
                    value={booleanLabel(detail.product.allow_negative_stock)}
                  />

                  <DetailRow
                    label="Producto activo"
                    value={booleanLabel(detail.product.is_active)}
                  />

                  <DetailRow
                    label="Variante activa"
                    value={booleanLabel(detail.variant.is_active)}
                  />

                  <DetailRow
                    label="Ubicación activa"
                    value={booleanLabel(detail.location.is_active)}
                  />

                  <DetailRow
                    label="Actualizado"
                    value={formatInventoryStockDateTime(
                      detail.updated_at,
                      locale,
                    )}
                  />

                  <DetailRow
                    label="Creado"
                    value={formatInventoryStockDateTime(
                      detail.created_at,
                      locale,
                    )}
                  />
                </dl>
              </section>
            </div>
          ) : null}
        </div>

        <footer className="flex shrink-0 items-center justify-end border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")}
              aria-hidden="true"
            />
            Actualizar
          </button>
        </footer>
      </aside>
    </div>
  );
}
