"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  Link2,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";

import { useEffect } from "react";

import type { InventoryMovement } from "../types";

import {
  formatInventoryMovementDate,
  formatInventoryMovementDateTime,
  formatInventoryMovementMoney,
  formatInventoryMovementQuantity,
  getInventoryDocumentStatusLabel,
  getInventoryDocumentTypeLabel,
  getInventoryMovementBadgeClass,
  getInventoryMovementDirection,
  getInventoryMovementLabel,
  getInventoryMovementUnitLabel,
  getInventoryMovementVariantLabel,
} from "../utils/inventoryMovementUi";

type InventoryMovementPreviewPanelProps = {
  movementId: string | null;
  detail: InventoryMovement | null;
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
    <div className="flex items-start justify-between gap-5 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>

      <dd
        className={[
          "max-w-[65%] break-words text-right text-sm font-semibold",
          valueClassName,
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Package;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>

        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="space-y-4 p-5">
      {Array.from({ length: 4 }).map((_, sectionIndex) => (
        <div
          key={sectionIndex}
          className="rounded-xl border border-slate-200 p-4"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />

          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((__, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center justify-between gap-4"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InventoryMovementPreviewPanel({
  movementId,
  detail,
  loading,
  error,
  locale,
  currency,
  onClose,
  onRefresh,
}: InventoryMovementPreviewPanelProps) {
  useEffect(() => {
    if (!movementId) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [movementId, onClose]);

  if (!movementId) {
    return null;
  }

  const direction = detail ? getInventoryMovementDirection(detail) : "NEUTRAL";

  let quantityLabel = "Cantidad";
  let quantityValue = "0";
  let valueLabel = "Valor";
  let valueAmount = "0";
  let movementValueClass = "text-slate-700";

  if (detail) {
    quantityValue = formatInventoryMovementQuantity(
      detail.quantity_delta,
      locale,
      detail.stock_unit.decimal_scale,
    );

    valueAmount = detail.total_cost_delta;

    if (direction === "IN") {
      quantityLabel = "Cantidad de entrada";

      quantityValue = `+${formatInventoryMovementQuantity(
        detail.quantity_in,
        locale,
        detail.stock_unit.decimal_scale,
      )}`;

      valueLabel = "Valor de entrada";
      valueAmount = detail.value_in;
      movementValueClass = "text-emerald-700";
    }

    if (direction === "OUT") {
      quantityLabel = "Cantidad de salida";

      quantityValue = `-${formatInventoryMovementQuantity(
        detail.quantity_out,
        locale,
        detail.stock_unit.decimal_scale,
      )}`;

      valueLabel = "Valor de salida";
      valueAmount = detail.value_out;
      movementValueClass = "text-amber-700";
    }
  }

  const relatedMovement =
    detail?.reversal_of_movement ?? detail?.reversal_movement ?? null;

  let relationshipLabel = "";

  if (detail?.reversal_of_movement) {
    relationshipLabel = "Este registro revierte el movimiento indicado.";
  }

  if (detail?.reversal_movement) {
    relationshipLabel =
      "Este registro fue revertido por el movimiento indicado.";
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/10">
      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer"
      />

      <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Movimiento seleccionado
            </p>

            <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">
              {detail?.posting_key || movementId}
            </h2>

            {detail ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={[
                    "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                    getInventoryMovementBadgeClass(detail),
                  ].join(" ")}
                >
                  {getInventoryMovementLabel(detail.movement_type)}
                </span>

                <span className="text-xs text-slate-500">
                  {formatInventoryMovementDateTime(detail.movement_at, locale)}
                </span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <LoadingPanel />
          ) : error ? (
            <div className="flex min-h-96 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-950">
                No se pudo cargar el movimiento
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={onRefresh}
                className="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Reintentar
              </button>
            </div>
          ) : detail ? (
            <div className="space-y-4 p-5">
              <section className="rounded-xl border border-slate-200 bg-white">
                <SectionHeader
                  icon={direction === "IN" ? ArrowDownToLine : ArrowUpFromLine}
                  title="Resumen"
                  description="Cantidad y valoración del movimiento."
                />

                <dl className="divide-y divide-slate-100 px-4">
                  <DetailRow
                    label="Tipo"
                    value={getInventoryMovementLabel(detail.movement_type)}
                  />

                  <DetailRow
                    label={quantityLabel}
                    value={quantityValue}
                    valueClassName={movementValueClass}
                  />

                  <DetailRow
                    label="Costo unitario"
                    value={formatInventoryMovementMoney(
                      detail.unit_cost,
                      locale,
                      currency,
                    )}
                  />

                  <DetailRow
                    label={valueLabel}
                    value={formatInventoryMovementMoney(
                      valueAmount,
                      locale,
                      currency,
                    )}
                    valueClassName={movementValueClass}
                  />

                  <DetailRow
                    label="Fecha"
                    value={formatInventoryMovementDateTime(
                      detail.movement_at,
                      locale,
                    )}
                  />
                </dl>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white">
                <SectionHeader
                  icon={Package}
                  title="Producto y ubicación"
                  description="Artículo y punto de inventario afectados."
                />

                <dl className="divide-y divide-slate-100 px-4">
                  <DetailRow label="Producto" value={detail.product.name} />

                  <DetailRow
                    label="Presentación"
                    value={getInventoryMovementVariantLabel(detail)}
                  />

                  <DetailRow
                    label="Unidad"
                    value={getInventoryMovementUnitLabel(detail)}
                  />

                  <DetailRow label="Ubicación" value={detail.location.name} />

                  <DetailRow
                    label="Código"
                    value={detail.location.location_code}
                  />
                </dl>

                <div className="flex items-start gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />

                  <p className="text-xs leading-5 text-slate-500">
                    Este movimiento modificó las existencias de{" "}
                    <span className="font-semibold text-slate-700">
                      {detail.location.name}
                    </span>
                    .
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white">
                <SectionHeader
                  icon={FileText}
                  title="Operación de origen"
                  description="Operación que generó este movimiento."
                />

                <dl className="divide-y divide-slate-100 px-4">
                  <DetailRow
                    label="Número"
                    value={detail.document.document_number}
                  />

                  <DetailRow
                    label="Tipo"
                    value={getInventoryDocumentTypeLabel(
                      detail.document.document_type,
                    )}
                  />

                  <DetailRow
                    label="Estado"
                    value={getInventoryDocumentStatusLabel(
                      detail.document.status,
                    )}
                  />

                  <DetailRow
                    label="Fecha"
                    value={formatInventoryMovementDate(
                      detail.document.document_date,
                      locale,
                    )}
                  />

                  <DetailRow
                    label="Línea"
                    value={String(detail.document_line.line_number)}
                  />

                  <DetailRow
                    label="Referencia"
                    value={detail.document.reference_number || "Sin referencia"}
                  />
                </dl>
              </section>

              {relatedMovement ? (
                <section className="rounded-xl border border-violet-200 bg-violet-50">
                  <div className="flex items-center gap-3 border-b border-violet-200 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-violet-700">
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-violet-950">
                        Relación de reversión
                      </h3>

                      <p className="mt-0.5 text-xs text-violet-700">
                        {relationshipLabel}
                      </p>
                    </div>
                  </div>

                  <dl className="divide-y divide-violet-200 px-4">
                    <DetailRow
                      label="Clave relacionada"
                      value={relatedMovement.posting_key}
                      valueClassName="text-violet-800"
                    />

                    <DetailRow
                      label="Tipo"
                      value={getInventoryMovementLabel(
                        relatedMovement.movement_type,
                      )}
                      valueClassName="text-violet-800"
                    />

                    <DetailRow
                      label="Fecha"
                      value={formatInventoryMovementDateTime(
                        relatedMovement.movement_at,
                        locale,
                      )}
                      valueClassName="text-violet-800"
                    />
                  </dl>
                </section>
              ) : null}

              <section className="rounded-xl border border-slate-200 bg-white">
                <SectionHeader
                  icon={Link2}
                  title="Auditoría"
                  description="Identificación y registro interno."
                />

                <dl className="divide-y divide-slate-100 px-4">
                  <DetailRow
                    label="Clave de publicación"
                    value={detail.posting_key}
                  />

                  <DetailRow
                    label="Creado por"
                    value={detail.created_by || "Usuario no registrado"}
                  />

                  <DetailRow
                    label="Registrado"
                    value={formatInventoryMovementDateTime(
                      detail.created_at,
                      locale,
                    )}
                  />
                </dl>

                {detail.notes ? (
                  <div className="border-t border-slate-100 px-4 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      Notas
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {detail.notes}
                    </p>
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")}
              aria-hidden="true"
            />
            Actualizar
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Cerrar
          </button>
        </footer>
      </aside>
    </div>
  );
}
