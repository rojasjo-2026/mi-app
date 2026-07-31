"use client";

import { AlertTriangle, Ban, Loader2, X } from "lucide-react";

import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import type { InventoryApiResponse, InventoryDocumentDetail } from "../types";

import { formatInventoryDocumentMoney } from "../utils/inventoryDocumentUi";

const MAX_CANCELLATION_REASON_LENGTH = 1000;

type InventoryDocumentCancelDialogProps = {
  open: boolean;
  detail: InventoryDocumentDetail | null;
  locale: string;
  currency: string;
  onClose: () => void;
  onCancelled: (document: InventoryDocumentDetail) => void;
};

export default function InventoryDocumentCancelDialog({
  open,
  detail,
  locale,
  currency,
  onClose,
  onCancelled,
}: InventoryDocumentCancelDialogProps) {
  const [cancellationReason, setCancellationReason] = useState("");

  const [cancelling, setCancelling] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setCancellationReason("");
    setError("");
  }, [detail?.inventory_document_id, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !cancelling) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [cancelling, onClose, open]);

  if (!open || !detail) {
    return null;
  }

  const inventoryDocumentId = detail.inventory_document_id;

  const normalizedReason = cancellationReason.trim();

  const canCancel =
    detail.status === "DRAFT" &&
    normalizedReason.length > 0 &&
    normalizedReason.length <= MAX_CANCELLATION_REASON_LENGTH;

  async function handleCancel() {
    if (cancelling || !canCancel) {
      return;
    }

    try {
      setCancelling(true);
      setError("");

      const response = await fetch(
        `/api/inventory/documents/${encodeURIComponent(
          inventoryDocumentId,
        )}/cancel`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            cancellation_reason: normalizedReason,
          }),
        },
      );

      const result: InventoryApiResponse<InventoryDocumentDetail> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "No se pudo cancelar el borrador.");
      }

      onCancelled(result.data);
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Ocurrió un error al cancelar el borrador.",
      );
    } finally {
      setCancelling(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onClose}
        disabled={cancelling}
        className="absolute inset-0 cursor-pointer bg-slate-950/10 disabled:cursor-not-allowed"
      />

      <section className="relative w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
            <Ban className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Borrador de inventario
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Cancelar operación
            </h2>

            <p className="mt-1 break-all text-xs text-slate-500">
              {detail.document_number}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={cancelling}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-semibold text-red-900">
                El borrador quedará cancelado.
              </p>

              <p className="mt-1 text-xs leading-5 text-red-800">
                Ya no podrás administrar sus productos ni procesar esta
                operación.
              </p>

              <p className="mt-1 text-xs leading-5 text-red-800">
                La cancelación no genera movimientos ni modifica las
                existencias.
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
                {detail.lines.length}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-slate-500">Valor del borrador</dt>

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

              <dd className="text-sm font-semibold text-red-700">Cancelado</dd>
            </div>
          </dl>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="inventory-cancellation-reason"
                className="text-sm font-semibold text-slate-800"
              >
                Motivo de cancelación
              </label>

              <span className="text-xs tabular-nums text-slate-400">
                {cancellationReason.length}/{MAX_CANCELLATION_REASON_LENGTH}
              </span>
            </div>

            <textarea
              id="inventory-cancellation-reason"
              value={cancellationReason}
              onChange={(event) => {
                setCancellationReason(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              maxLength={MAX_CANCELLATION_REASON_LENGTH}
              rows={5}
              disabled={cancelling}
              placeholder="Explica por qué se cancela este borrador."
              className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed disabled:bg-slate-50"
            />

            {!normalizedReason ? (
              <p className="mt-1.5 text-xs text-slate-500">
                El motivo es obligatorio.
              </p>
            ) : null}
          </div>

          {detail.status !== "DRAFT" ? (
            <p className="text-sm font-medium text-red-600">
              Solo pueden cancelarse operaciones en borrador.
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={cancelling}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Volver
          </button>

          <button
            type="button"
            onClick={() => void handleCancel()}
            disabled={cancelling || !canCancel}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelling ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Ban className="h-4 w-4" aria-hidden="true" />
            )}

            {cancelling ? "Cancelando..." : "Cancelar borrador"}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
