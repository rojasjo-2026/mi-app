"use client";

import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  PackageCheck,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import { createPortal } from "react-dom";

import type { InventoryApiResponse, InventoryDocumentDetail } from "../types";

import { formatInventoryDocumentMoney } from "../utils/inventoryDocumentUi";

type InventoryDocumentProcessDialogProps = {
  open: boolean;
  detail: InventoryDocumentDetail | null;
  locale: string;
  currency: string;
  onClose: () => void;
  onProcessed: (document: InventoryDocumentDetail) => void;
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

export default function InventoryDocumentProcessDialog({
  open,
  detail,
  locale,
  currency,
  onClose,
  onProcessed,
}: InventoryDocumentProcessDialogProps) {
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");

  const isTransfer = detail?.document_type === "TRANSFER";

  const productCount = detail?.lines.length ?? 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");
  }, [detail?.inventory_document_id, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !processing) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, processing]);

  if (!open || !detail) {
    return null;
  }

  const inventoryDocumentId = detail.inventory_document_id;

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

  const actionLabel = isTransfer
    ? "Despachar transferencia"
    : "Procesar operación";

  const title = isTransfer ? "Confirmar despacho" : "Confirmar procesamiento";

  const resultingStatus = isTransfer ? "En tránsito" : "Publicado";

  async function handleProcess() {
    if (processing || productCount === 0) {
      return;
    }

    try {
      setProcessing(true);
      setError("");

      const action = isTransfer ? "dispatch" : "post";

      const response = await fetch(
        `/api/inventory/documents/${encodeURIComponent(inventoryDocumentId)}/${action}`,
        {
          method: "POST",
        },
      );

      const result: InventoryApiResponse<InventoryDocumentDetail> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "No se pudo procesar la operación.");
      }

      onProcessed(result.data);
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : "Ocurrió un error al procesar la operación.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar confirmación"
        onClick={onClose}
        disabled={processing}
        className="absolute inset-0 cursor-pointer bg-slate-950/10 disabled:cursor-not-allowed"
      />

      <section className="relative w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
            <PackageCheck className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Operación de inventario
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              {title}
            </h2>

            <p className="mt-1 break-all text-xs text-slate-500">
              {detail.document_number}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-semibold text-amber-900">
                Esta acción modificará las existencias.
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                {isTransfer
                  ? "Los productos saldrán de la ubicación de origen y la transferencia quedará en tránsito."
                  : "Se generará un movimiento por cada producto y la operación quedará publicada."}
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-800">
                Después de procesarla no podrás editar ni quitar sus productos.
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
              <dt className="text-sm text-slate-500">
                {detail.document_type === "ISSUE"
                  ? "Valor registrado en el borrador"
                  : "Costo total"}
              </dt>

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

              <dd className="text-sm font-semibold text-slate-950">
                {resultingStatus}
              </dd>
            </div>
          </dl>

          {detail.document_type === "ISSUE" ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
              El valor final se calculará usando el costo promedio actual de las
              existencias.
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              {isTransfer ? "Ubicaciones" : "Ubicación afectada"}
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

          {productCount === 0 ? (
            <p className="text-sm font-medium text-red-600">
              Agrega al menos un producto antes de procesar esta operación.
            </p>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => void handleProcess()}
            disabled={processing || productCount === 0}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <PackageCheck className="h-4 w-4" aria-hidden="true" />
            )}

            {processing ? "Procesando..." : actionLabel}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
