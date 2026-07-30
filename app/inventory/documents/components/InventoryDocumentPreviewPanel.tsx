"use client";

import {
  AlertTriangle,
  CalendarClock,
  FileText,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  X,
} from "lucide-react";

import { useEffect } from "react";

import type { InventoryDocumentDetail } from "../types";

import {
  formatInventoryDocumentDate,
  formatInventoryDocumentDateTime,
  formatInventoryDocumentMoney,
  formatInventoryDocumentQuantity,
  formatInventoryDocumentStatus,
  formatInventoryDocumentType,
  getInventoryDocumentLocationLabel,
  getInventoryDocumentStatusClassName,
  getInventoryDocumentVariantLabel,
} from "../utils/inventoryDocumentUi";

type InventoryDocumentPreviewPanelProps = {
  documentId: string | null;
  detail: InventoryDocumentDetail | null;
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
          "max-w-[68%] text-right text-sm font-semibold",
          valueClassName,
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

export default function InventoryDocumentPreviewPanel({
  documentId,
  detail,
  loading,
  error,
  locale,
  currency,
  onClose,
  onRefresh,
}: InventoryDocumentPreviewPanelProps) {
  useEffect(() => {
    if (!documentId) {
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
  }, [documentId, onClose]);

  if (!documentId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Cerrar detalle de la operación"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-slate-950/5"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Operación seleccionada
            </p>

            <h2 className="mt-1 truncate text-base font-semibold text-slate-950">
              {detail?.document_number || "Cargando operación..."}
            </h2>

            {detail ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {formatInventoryDocumentType(detail.document_type)}
                </span>

                <span
                  className={[
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    getInventoryDocumentStatusClassName(detail.status),
                  ].join(" ")}
                >
                  {formatInventoryDocumentStatus(detail.status)}
                </span>
              </div>
            ) : null}
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
                Cargando operación...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <AlertTriangle
                className="h-7 w-7 text-red-600"
                aria-hidden="true"
              />

              <p className="mt-3 text-sm font-semibold text-slate-800">
                No fue posible cargar la operación
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
                  <FileText
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-slate-950">
                    Resumen
                  </h3>
                </div>

                <dl className="mt-3">
                  <DetailRow
                    label="Tipo"
                    value={formatInventoryDocumentType(detail.document_type)}
                  />

                  <DetailRow
                    label="Estado"
                    value={formatInventoryDocumentStatus(detail.status)}
                  />

                  <DetailRow
                    label="Fecha"
                    value={formatInventoryDocumentDate(
                      detail.document_date,
                      locale,
                    )}
                  />

                  <DetailRow
                    label="Productos"
                    value={String(detail.lines_count)}
                  />

                  <DetailRow
                    label="Movimientos"
                    value={String(detail.movements_count)}
                  />

                  <DetailRow
                    label="Costo total"
                    value={formatInventoryDocumentMoney(
                      detail.total_cost,
                      locale,
                      currency,
                    )}
                    valueClassName="text-emerald-700"
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
                    Ubicaciones
                  </h3>
                </div>

                <dl className="mt-3">
                  <DetailRow
                    label="Origen"
                    value={getInventoryDocumentLocationLabel(
                      detail.source_location,
                    )}
                  />

                  <DetailRow
                    label="Destino"
                    value={getInventoryDocumentLocationLabel(
                      detail.destination_location,
                    )}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Package
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-slate-950">
                    Productos de la operación
                  </h3>
                </div>

                {detail.lines.length === 0 ? (
                  <p className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center text-sm text-slate-500">
                    Esta operación no contiene productos.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {detail.lines.map((line) => (
                      <article
                        key={line.inventory_document_line_id}
                        className="rounded-md border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {line.product_name_snapshot}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {getInventoryDocumentVariantLabel(
                                line.variant_name_snapshot,
                                line.variant.is_default,
                              )}{" "}
                              · {line.unit_of_measure.name}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            Línea {line.line_number}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Cantidad
                            </p>

                            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
                              {formatInventoryDocumentQuantity(
                                line.quantity,
                                locale,
                                line.unit_of_measure.decimal_scale,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Existencia
                            </p>

                            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
                              {formatInventoryDocumentQuantity(
                                line.stock_quantity,
                                locale,
                                line.unit_of_measure.decimal_scale,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Costo unitario
                            </p>

                            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
                              {formatInventoryDocumentMoney(
                                line.unit_cost,
                                locale,
                                currency,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Total
                            </p>

                            <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-700">
                              {formatInventoryDocumentMoney(
                                line.total_cost,
                                locale,
                                currency,
                              )}
                            </p>
                          </div>
                        </div>

                        {line.notes ? (
                          <p className="mt-3 border-t border-slate-200 pt-2 text-xs leading-5 text-slate-500">
                            {line.notes}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock
                    className="h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-slate-950">
                    Referencia y auditoría
                  </h3>
                </div>

                <dl className="mt-3">
                  <DetailRow
                    label="Referencia"
                    value={detail.reference_number || "Sin referencia"}
                  />

                  <DetailRow
                    label="Tipo de referencia"
                    value={detail.reference_type || "Sin tipo"}
                  />

                  <DetailRow
                    label="Creado por"
                    value={detail.created_by || "No registrado"}
                  />

                  <DetailRow
                    label="Publicado"
                    value={formatInventoryDocumentDateTime(
                      detail.posted_at,
                      locale,
                    )}
                  />

                  <DetailRow
                    label="Recibido"
                    value={formatInventoryDocumentDateTime(
                      detail.received_at,
                      locale,
                    )}
                  />

                  <DetailRow
                    label="Actualizado"
                    value={formatInventoryDocumentDateTime(
                      detail.updated_at,
                      locale,
                    )}
                  />
                </dl>

                {detail.notes ? (
                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Notas
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {detail.notes}
                    </p>
                  </div>
                ) : null}
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
