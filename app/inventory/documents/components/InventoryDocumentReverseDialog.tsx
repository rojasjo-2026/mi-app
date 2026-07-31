"use client";

import { AlertTriangle, ArrowRight, Loader2, RotateCcw, X } from "lucide-react";

import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import type { InventoryApiResponse, InventoryDocumentDetail } from "../types";

import { formatInventoryDocumentMoney } from "../utils/inventoryDocumentUi";

const MAX_REVERSAL_REASON_LENGTH = 1000;

type InventoryDocumentReversalResult = {
  original_document: InventoryDocumentDetail;
  reversal_document: InventoryDocumentDetail;
};

type InventoryDocumentReverseDialogProps = {
  open: boolean;
  detail: InventoryDocumentDetail | null;
  locale: string;
  currency: string;
  onClose: () => void;
  onReversed: (
    originalDocument: InventoryDocumentDetail,
    reversalDocument: InventoryDocumentDetail,
  ) => void;
};

function getLocationLabel(
  location: InventoryDocumentDetail["source_location"],
  emptyLabel: string,
) {
  if (!location) {
    return emptyLabel;
  }

  return `${location.name} (${location.location_code})`;
}

export default function InventoryDocumentReverseDialog({
  open,
  detail,
  locale,
  currency,
  onClose,
  onReversed,
}: InventoryDocumentReverseDialogProps) {
  const [reversalReason, setReversalReason] = useState("");

  const [reversing, setReversing] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setReversalReason("");
    setError("");
  }, [detail?.inventory_document_id, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !reversing) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, reversing]);

  if (!open || !detail) {
    return null;
  }

  const inventoryDocumentId = detail.inventory_document_id;

  const normalizedReason = reversalReason.trim();

  const isTransfer = detail.document_type === "TRANSFER";

  const statusAllowsReversal = isTransfer
    ? detail.status === "RECEIVED"
    : detail.status === "POSTED";

  const productCount = detail.lines.length;

  const movementCount = detail.movements_count;

  const canReverse =
    statusAllowsReversal &&
    productCount > 0 &&
    movementCount > 0 &&
    normalizedReason.length > 0 &&
    normalizedReason.length <= MAX_REVERSAL_REASON_LENGTH;

  const sourceLabel = getLocationLabel(
    detail.source_location,
    "Sin ubicación de origen",
  );

  const destinationLabel = getLocationLabel(
    detail.destination_location,
    "Sin ubicación de destino",
  );

  const affectedLocationLabel = detail.destination_location
    ? destinationLabel
    : sourceLabel;

  async function handleReverse() {
    if (reversing || !canReverse) {
      return;
    }

    try {
      setReversing(true);
      setError("");

      const response = await fetch(
        `/api/inventory/documents/${encodeURIComponent(
          inventoryDocumentId,
        )}/reverse`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            reversal_reason: normalizedReason,
          }),
        },
      );

      const result: InventoryApiResponse<InventoryDocumentReversalResult> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "No se pudo reversar la operación.");
      }

      onReversed(result.data.original_document, result.data.reversal_document);
    } catch (reverseError) {
      setError(
        reverseError instanceof Error
          ? reverseError.message
          : "Ocurrió un error al reversar la operación.",
      );
    } finally {
      setReversing(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onClose}
        disabled={reversing}
        className="absolute inset-0 cursor-pointer bg-slate-950/10 disabled:cursor-not-allowed"
      />

      <section className="relative w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-700">
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Operación de inventario
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Reversar operación
            </h2>

            <p className="mt-1 break-all text-xs text-slate-500">
              {detail.document_number}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={reversing}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-violet-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-semibold text-violet-900">
                Esta acción creará movimientos contrarios.
              </p>

              <p className="mt-1 text-xs leading-5 text-violet-800">
                Se generará una nueva operación de reversión para devolver las
                existencias a su situación anterior.
              </p>

              <p className="mt-1 text-xs leading-5 text-violet-800">
                La operación original quedará reversada y no podrá procesarse
                nuevamente.
              </p>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-4">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">Productos</dt>

              <dd className="text-sm font-semibold text-slate-950">
                {productCount}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">Movimientos a revertir</dt>

              <dd className="text-sm font-semibold text-slate-950">
                {movementCount}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">Valor de la operación</dt>

              <dd className="text-sm font-semibold tabular-nums text-slate-950">
                {formatInventoryDocumentMoney(
                  detail.total_cost,
                  locale,
                  currency,
                )}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">Estado resultante</dt>

              <dd className="text-sm font-semibold text-violet-700">
                Reversado
              </dd>
            </div>
          </dl>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              {isTransfer
                ? "Recorrido que será revertido"
                : "Ubicación afectada"}
            </p>

            {isTransfer ? (
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="min-w-0 truncate">{sourceLabel}</span>

                <ArrowRight
                  className="h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />

                <span className="min-w-0 truncate">{destinationLabel}</span>
              </div>
            ) : (
              <p className="mt-2 truncate text-sm font-semibold text-slate-700">
                {affectedLocationLabel}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            La reversión puede ser rechazada si las existencias necesarias ya
            fueron utilizadas o no están disponibles.
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="inventory-reversal-reason"
                className="text-sm font-semibold text-slate-800"
              >
                Motivo de reversión
              </label>

              <span className="text-xs tabular-nums text-slate-400">
                {reversalReason.length}/{MAX_REVERSAL_REASON_LENGTH}
              </span>
            </div>

            <textarea
              id="inventory-reversal-reason"
              value={reversalReason}
              onChange={(event) => {
                setReversalReason(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              maxLength={MAX_REVERSAL_REASON_LENGTH}
              rows={5}
              disabled={reversing}
              placeholder="Explica por qué debe revertirse esta operación."
              className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-50 disabled:cursor-not-allowed disabled:bg-slate-50"
            />

            {!normalizedReason ? (
              <p className="mt-1.5 text-xs text-slate-500">
                El motivo es obligatorio.
              </p>
            ) : null}
          </div>

          {!statusAllowsReversal ? (
            <p className="text-sm font-medium text-red-600">
              {isTransfer
                ? "Solo pueden reversarse transferencias recibidas."
                : "Solo pueden reversarse operaciones publicadas."}
            </p>
          ) : null}

          {productCount === 0 || movementCount === 0 ? (
            <p className="text-sm font-medium text-red-600">
              La operación debe contener productos y movimientos publicados.
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={reversing}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Volver
          </button>

          <button
            type="button"
            onClick={() => void handleReverse()}
            disabled={reversing || !canReverse}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reversing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            )}

            {reversing ? "Reversando..." : "Reversar operación"}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
