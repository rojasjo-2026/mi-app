"use client";

import { AlertCircle, Clock3, FileText, RefreshCw, X } from "lucide-react";

import { useEffect } from "react";

import InventoryReservationActions from "./InventoryReservationActions";

import type { InventoryReservationDetail } from "../types";

import {
  formatInventoryDate,
  formatInventoryQuantity,
  getExpirationLabel,
  getReservationEventLabel,
  getReservationSituationText,
  getReservationStatusClasses,
  getReservationStatusLabel,
} from "../utils/inventoryReservationUi";

type QuantityStatProps = {
  label: string;
  value: string;
  helper: string;
};

function QuantityStat({ label, value, helper }: QuantityStatProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-lg font-semibold leading-none text-slate-950">
        {value}
      </p>

      <p className="mt-1 truncate text-xs font-medium text-slate-500">
        {helper}
      </p>
    </div>
  );
}

type DetailFieldProps = {
  label: string;
  value: string;
};

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        title={value}
        className="mt-1 truncate text-sm font-semibold text-slate-800"
      >
        {value}
      </p>
    </div>
  );
}

type InventoryReservationPreviewPanelProps = {
  reservationId: string | null;
  detail: InventoryReservationDetail | null;
  loading: boolean;
  error: string;
  locale: string;
  onClose: () => void;
  onRefresh: () => void;
  onActionCompleted: (nextStatus: InventoryReservationDetail["status"]) => void;
};

export default function InventoryReservationPreviewPanel({
  reservationId,
  detail,
  loading,
  error,
  locale,
  onClose,
  onRefresh,
  onActionCompleted,
}: InventoryReservationPreviewPanelProps) {
  useEffect(() => {
    if (!reservationId) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, reservationId]);

  if (!reservationId) {
    return null;
  }

  const expiration = detail
    ? getExpirationLabel(detail.expiration, detail.expires_at, locale)
    : null;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Cerrar detalle de la reserva"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-slate-950/[0.04]"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-reservation-preview-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col bg-white shadow-[-18px_0_45px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5"
      >
        <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Reserva seleccionada
              </p>

              <h2
                id="inventory-reservation-preview-title"
                title={detail?.reservation_number || "Cargando reserva"}
                className="mt-1 truncate text-base font-semibold tracking-tight text-slate-950"
              >
                {detail?.reservation_number || "Cargando reserva..."}
              </h2>

              <p className="mt-1 truncate text-xs font-medium text-slate-500">
                {detail?.reference_number ||
                  detail?.reference_id ||
                  "Sin referencia operativa"}
              </p>

              {detail ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={[
                      "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      getReservationStatusClasses(detail.status),
                    ].join(" ")}
                  >
                    {getReservationStatusLabel(detail.status)}
                  </span>

                  {expiration &&
                  detail &&
                  !["CONSUMED", "RELEASED", "EXPIRED", "CANCELLED"].includes(
                    detail.status,
                  ) ? (
                    <span
                      className={[
                        "inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold",
                        expiration.className,
                      ].join(" ")}
                    >
                      {expiration.helper}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle de la reserva"
              title="Cerrar"
              className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <section className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Acciones rápidas
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Operaciones permitidas para el estado actual
              </p>
            </div>

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
          </div>

          {detail ? (
            <InventoryReservationActions
              reservation={detail}
              onCompleted={onActionCompleted}
            />
          ) : null}
        </section>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {loading && !detail ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : null}

          {error ? (
            <div className="p-5">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                    aria-hidden="true"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      No se pudo cargar el detalle
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {detail ? (
            <div className="space-y-5 p-5">
              <section>
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Situacion operativa
                </p>

                <div
                  className={[
                    "rounded-lg border p-4",
                    detail.expiration.is_overdue
                      ? "border-red-200 bg-red-50"
                      : detail.expiration.is_expiring_soon
                        ? "border-amber-200 bg-amber-50"
                        : "border-blue-100 bg-blue-50/70",
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold leading-6 text-slate-800">
                    {getReservationSituationText(detail, locale)}
                  </p>
                </div>
              </section>

              <section>
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Flujo de cantidades
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <QuantityStat
                    label="Solicitado"
                    value={formatInventoryQuantity(
                      detail.quantity_totals.requested,
                      locale,
                    )}
                    helper="Cantidad original"
                  />

                  <QuantityStat
                    label="Comprometido"
                    value={formatInventoryQuantity(
                      detail.quantity_totals.reserved,
                      locale,
                    )}
                    helper="Pendiente operativo"
                  />

                  <QuantityStat
                    label="Consumido"
                    value={formatInventoryQuantity(
                      detail.quantity_totals.consumed,
                      locale,
                    )}
                    helper="Salida procesada"
                  />

                  <QuantityStat
                    label="Liberado"
                    value={formatInventoryQuantity(
                      detail.quantity_totals.released,
                      locale,
                    )}
                    helper="Devuelto a disponibilidad"
                  />
                </div>
              </section>

              {!["CONSUMED", "RELEASED", "EXPIRED", "CANCELLED"].includes(
                detail.status,
              ) ? (
                <section>
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    Vencimiento
                  </p>

                  <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                      <Clock3 className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={[
                          "text-sm font-semibold",
                          expiration?.className || "text-slate-700",
                        ].join(" ")}
                      >
                        {expiration?.label || "Sin fecha"}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {expiration?.helper ||
                          "No tiene vencimiento configurado"}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Productos y ubicaciones
                  </p>

                  <span className="text-xs font-semibold text-slate-400">
                    {detail.lines.length} linea
                    {detail.lines.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-2">
                  {detail.lines.map((line) => (
                    <article
                      key={line.inventory_reservation_line_id}
                      className="rounded-lg border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {line.variant.product.name}
                          </p>

                          <p className="mt-1 truncate text-xs font-medium text-slate-500">
                            {line.variant.name || "Variante principal"} ·{" "}
                            {line.location.name}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {line.variant.product.product_type} ·{" "}
                            {line.location.location_code}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          Linea {line.line_number}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Solic.
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {formatInventoryQuantity(
                              line.quantity_requested,
                              locale,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Reserv.
                          </p>

                          <p className="mt-1 text-sm font-semibold text-blue-700">
                            {formatInventoryQuantity(
                              line.quantity_reserved,
                              locale,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Consum.
                          </p>

                          <p className="mt-1 text-sm font-semibold text-emerald-700">
                            {formatInventoryQuantity(
                              line.quantity_consumed,
                              locale,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Liber.
                          </p>

                          <p className="mt-1 text-sm font-semibold text-violet-700">
                            {formatInventoryQuantity(
                              line.quantity_released,
                              locale,
                            )}
                          </p>
                        </div>
                      </div>

                      {line.notes ? (
                        <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                          {line.notes}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  Origen y auditoria
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  <DetailField
                    label="Tipo de referencia"
                    value={detail.reference_type || "Reserva manual"}
                  />

                  <DetailField
                    label="Numero de referencia"
                    value={
                      detail.reference_number ||
                      detail.reference_id ||
                      "Sin referencia"
                    }
                  />

                  <DetailField
                    label="Creada por"
                    value={detail.created_by || "Sistema"}
                  />

                  <DetailField
                    label="Fecha de creacion"
                    value={formatInventoryDate(detail.created_at, locale, true)}
                  />

                  <DetailField
                    label="Ultima actualizacion"
                    value={formatInventoryDate(detail.updated_at, locale, true)}
                  />

                  <DetailField
                    label="Idempotencia"
                    value={detail.idempotency_key || "No aplica"}
                  />
                </div>

                {detail.notes ? (
                  <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Notas
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {detail.notes}
                    </p>
                  </div>
                ) : null}
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Documentos relacionados
                  </p>

                  <span className="text-xs font-semibold text-slate-400">
                    {detail.related_consumption_documents.length}
                  </span>
                </div>

                {detail.related_consumption_documents.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    La reserva todavia no ha generado documentos de consumo.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.related_consumption_documents.map((document) => (
                      <article
                        key={document.inventory_document_id}
                        className="rounded-lg border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {document.document_number}
                            </p>

                            <p className="mt-1 text-xs font-medium text-slate-500">
                              {document.document_type} Ãƒâ€šÃ‚Â·{" "}
                              {document.status}
                            </p>
                          </div>

                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {document.movements_count} movimiento
                            {document.movements_count === 1 ? "" : "s"}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          {formatInventoryDate(document.document_date, locale)}{" "}
                          Ãƒâ€šÃ‚Â· {document.lines_count} linea
                          {document.lines_count === 1 ? "" : "s"}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Historial de eventos
                  </p>

                  <span className="text-xs font-semibold text-slate-400">
                    {detail.events.length}
                  </span>
                </div>

                {detail.events.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    No hay eventos registrados.
                  </div>
                ) : (
                  <ol className="space-y-0">
                    {detail.events.map((event, index) => (
                      <li
                        key={event.inventory_reservation_event_id}
                        className="relative flex gap-3 pb-4 last:pb-0"
                      >
                        {index < detail.events.length - 1 ? (
                          <span
                            aria-hidden="true"
                            className="absolute left-[7px] top-4 h-full w-px bg-slate-200"
                          />
                        ) : null}

                        <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white bg-blue-500 ring-1 ring-blue-200" />

                        <div className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2.5">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <p className="text-sm font-semibold text-slate-800">
                              {getReservationEventLabel(event.event_type)}
                            </p>

                            <p className="shrink-0 text-xs text-slate-400">
                              {formatInventoryDate(
                                event.created_at,
                                locale,
                                true,
                              )}
                            </p>
                          </div>

                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {event.created_by || "Sistema"}
                            {event.quantity
                              ? ` Ãƒâ€šÃ‚Â· ${formatInventoryQuantity(
                                  event.quantity,
                                  locale,
                                )} unidades`
                              : ""}
                          </p>

                          {event.reason ? (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {event.reason}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
