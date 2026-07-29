"use client";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Loader2,
  PackageCheck,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryReservationDetail,
} from "../types";

import { formatInventoryQuantity } from "../utils/inventoryReservationUi";

type ReservationAction = "activate" | "cancel";

type InventoryReservationActionsProps = {
  reservation: InventoryReservationDetail;

  onCompleted: (nextStatus: InventoryReservationDetail["status"]) => void;
};

function getResponseError(
  result: InventoryApiResponse<unknown>,
  fallbackMessage: string,
) {
  const fieldError = result.errors
    ? Object.values(result.errors).find(
        (value) => typeof value === "string" && value.trim().length > 0,
      )
    : null;

  return fieldError || result.message || fallbackMessage;
}

export default function InventoryReservationActions({
  reservation,
  onCompleted,
}: InventoryReservationActionsProps) {
  const [activeAction, setActiveAction] = useState<ReservationAction | null>(
    null,
  );

  const [cancellationReason, setCancellationReason] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const cleanCancellationReason = cancellationReason.trim();

  useEffect(() => {
    if (!activeAction) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        setActiveAction(null);

        setError("");
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeAction, submitting]);

  function openAction(action: ReservationAction) {
    setError("");

    setSuccessMessage("");

    setCancellationReason("");

    setActiveAction(action);
  }

  function closeDialog() {
    if (submitting) {
      return;
    }

    setActiveAction(null);

    setError("");

    setCancellationReason("");
  }

  async function submitAction() {
    if (!activeAction) {
      return;
    }

    if (activeAction === "cancel" && !cleanCancellationReason) {
      setError("Debés indicar el motivo de cancelación.");

      return;
    }

    try {
      setSubmitting(true);

      setError("");

      const endpoint =
        activeAction === "activate"
          ? `/api/inventory/reservations/${reservation.inventory_reservation_id}/activate`
          : `/api/inventory/reservations/${reservation.inventory_reservation_id}/cancel`;

      const response = await fetch(
        endpoint,
        activeAction === "activate"
          ? {
              method: "POST",
            }
          : {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                cancellation_reason: cleanCancellationReason,
              }),
            },
      );

      let result: InventoryApiResponse<unknown>;

      try {
        result = await response.json();
      } catch {
        throw new Error("El servidor devolvió una respuesta no válida.");
      }

      if (!response.ok || !result.success) {
        throw new Error(
          getResponseError(
            result,
            activeAction === "activate"
              ? "No se pudo activar la reserva."
              : "No se pudo cancelar la reserva.",
          ),
        );
      }

      const message =
        result.message ||
        (activeAction === "activate"
          ? "Reserva activada correctamente."
          : "Reserva cancelada correctamente.");

      setSuccessMessage(message);

      setActiveAction(null);

      setCancellationReason("");

      const nextStatus = activeAction === "activate" ? "ACTIVE" : "CANCELLED";

      onCompleted(nextStatus);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Ocurrió un error al procesar la acción.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const hasDraftActions =
    reservation.actions.can_activate || reservation.actions.can_cancel;

  return (
    <>
      {successMessage ? (
        <div
          role="status"
          className="mt-3 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5"
        >
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
            aria-hidden="true"
          />

          <p className="text-xs font-semibold leading-5 text-emerald-700">
            {successMessage}
          </p>
        </div>
      ) : null}

      {hasDraftActions ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {reservation.actions.can_activate ? (
            <button
              type="button"
              onClick={() => openAction("activate")}
              disabled={submitting}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PackageCheck className="h-4 w-4" aria-hidden="true" />
              Activar reserva
            </button>
          ) : null}

          {reservation.actions.can_cancel ? (
            <button
              type="button"
              onClick={() => openAction("cancel")}
              disabled={submitting}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Ban className="h-4 w-4" aria-hidden="true" />
              Cancelar
            </button>
          ) : null}
        </div>
      ) : null}

      {activeAction ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            onClick={closeDialog}
            disabled={submitting}
            className="absolute inset-0 cursor-pointer bg-slate-950/35 backdrop-blur-[1px] disabled:cursor-not-allowed"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-reservation-action-title"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                  activeAction === "activate"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-red-50 text-red-600",
                ].join(" ")}
              >
                {activeAction === "activate" ? (
                  <PackageCheck className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Confirmación operativa
                </p>

                <h3
                  id="inventory-reservation-action-title"
                  className="mt-1 text-base font-semibold text-slate-950"
                >
                  {activeAction === "activate"
                    ? "Activar reserva"
                    : "Cancelar reserva"}
                </h3>

                <p className="mt-1 truncate text-xs font-medium text-slate-500">
                  {reservation.reservation_number}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                aria-label="Cerrar"
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="space-y-4 px-5 py-5">
              {activeAction === "activate" ? (
                <>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-semibold leading-6 text-slate-800">
                      Se comprometerán{" "}
                      {formatInventoryQuantity(
                        reservation.quantity_totals.requested,
                        "es",
                      )}{" "}
                      unidades de inventario.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      La existencia física no cambia, pero la cantidad
                      disponible disminuirá porque quedará reservada para este
                      proceso.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Cantidad
                      </p>

                      <p className="mt-1 text-lg font-semibold text-slate-950">
                        {formatInventoryQuantity(
                          reservation.quantity_totals.requested,
                          "es",
                        )}
                      </p>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Líneas
                      </p>

                      <p className="mt-1 text-lg font-semibold text-slate-950">
                        {reservation.lines.length}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-800">
                      La reserva quedará cancelada definitivamente.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-red-700">
                      Como todavía está en borrador, esta operación no modifica
                      las existencias ni las cantidades reservadas.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="inventory-reservation-cancellation-reason"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Motivo de cancelación
                    </label>

                    <textarea
                      id="inventory-reservation-cancellation-reason"
                      value={cancellationReason}
                      onChange={(event) =>
                        setCancellationReason(event.target.value)
                      }
                      maxLength={1000}
                      rows={4}
                      autoFocus
                      placeholder="Explicá por qué se cancela esta reserva..."
                      className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                    />

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-400">
                        Campo obligatorio
                      </p>

                      <p className="text-xs tabular-nums text-slate-400">
                        {cancellationReason.length}/1000
                      </p>
                    </div>
                  </div>
                </>
              )}

              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5"
                >
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                    aria-hidden="true"
                  />

                  <p className="text-xs font-semibold leading-5 text-red-700">
                    {error}
                  </p>
                </div>
              ) : null}
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Volver
              </button>

              <button
                type="button"
                onClick={() => void submitAction()}
                disabled={
                  submitting ||
                  (activeAction === "cancel" && !cleanCancellationReason)
                }
                className={[
                  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
                  activeAction === "activate"
                    ? "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-100"
                    : "bg-red-600 hover:bg-red-700 focus-visible:ring-red-100",
                ].join(" ")}
              >
                {submitting ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : activeAction === "activate" ? (
                  <PackageCheck className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Ban className="h-4 w-4" aria-hidden="true" />
                )}

                {submitting
                  ? "Procesando..."
                  : activeAction === "activate"
                    ? "Confirmar activación"
                    : "Confirmar cancelación"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
