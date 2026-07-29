"use client";

import { AlertTriangle, CheckCircle2, Clock3, Loader2, X } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryReservationDetail,
  InventoryReservationStatus,
} from "../types";

import { formatInventoryQuantity } from "../utils/inventoryReservationUi";

type InventoryReservationExpirationActionProps = {
  reservation: InventoryReservationDetail;
  locale: string;

  onCompleted: (nextStatus: InventoryReservationStatus) => void;
};

type ExpirationResponseData = {
  outcome: "EXPIRED" | "ALREADY_EXPIRED";

  quantity_released: string;

  reservation: InventoryReservationDetail;
};

const DEFAULT_EXPIRATION_REASON = "La reserva alcanzó su fecha de vencimiento.";

function getResponseError(result: InventoryApiResponse<unknown>) {
  const fieldError = result.errors
    ? Object.values(result.errors).find(
        (value) => typeof value === "string" && value.trim().length > 0,
      )
    : null;

  return fieldError || result.message || "No se pudo vencer la reserva.";
}

export default function InventoryReservationExpirationAction({
  reservation,
  locale,
  onCompleted,
}: InventoryReservationExpirationActionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const [reason, setReason] = useState(DEFAULT_EXPIRATION_REASON);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const quantityReserved = useMemo(
    () =>
      reservation.lines.reduce(
        (total, line) => total + Number(line.quantity_reserved),
        0,
      ),
    [reservation.lines],
  );

  const cleanReason = reason.trim();

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        setDialogOpen(false);

        setError("");
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialogOpen, submitting]);

  function openDialog() {
    setReason(DEFAULT_EXPIRATION_REASON);

    setError("");

    setSuccessMessage("");

    setDialogOpen(true);
  }

  function closeDialog() {
    if (submitting) {
      return;
    }

    setDialogOpen(false);

    setError("");
  }

  async function submitExpiration() {
    if (!cleanReason) {
      setError("Debés indicar el motivo del vencimiento.");

      return;
    }

    try {
      setSubmitting(true);

      setError("");

      const response = await fetch(
        `/api/inventory/reservations/${reservation.inventory_reservation_id}/expire`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            expiration_reason: cleanReason,

            expired_by: "clarius-inventory-ui",
          }),
        },
      );

      let result: InventoryApiResponse<ExpirationResponseData>;

      try {
        result = await response.json();
      } catch {
        throw new Error("El servidor devolvió una respuesta no válida.");
      }

      if (!response.ok || !result.success) {
        throw new Error(getResponseError(result));
      }

      const updatedReservation = result.data?.reservation;

      if (!updatedReservation) {
        throw new Error(
          "La operación terminó, pero no devolvió la reserva actualizada.",
        );
      }

      setDialogOpen(false);

      setSuccessMessage(result.message || "Reserva vencida correctamente.");

      onCompleted(updatedReservation.status);
    } catch (expirationError) {
      setError(
        expirationError instanceof Error
          ? expirationError.message
          : "Ocurrió un error al vencer la reserva.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!reservation.actions.can_expire) {
    return null;
  }

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

      <button
        type="button"
        onClick={openDialog}
        disabled={submitting}
        className="mt-2 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        Vencer reserva
      </button>

      {dialogOpen ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            onClick={closeDialog}
            disabled={submitting}
            className="absolute inset-0 cursor-pointer bg-slate-950/40 backdrop-blur-[1px] disabled:cursor-not-allowed"
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-reservation-expiration-title"
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                <Clock3 className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Vencimiento operativo
                </p>

                <h3
                  id="inventory-reservation-expiration-title"
                  className="mt-1 text-base font-semibold text-slate-950"
                >
                  Vencer reserva
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
                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className="mt-0.5 h-5 w-5 shrink-0 text-red-700"
                    aria-hidden="true"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      La reserva cambiará al estado Vencida.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-red-800">
                      Se liberarán{" "}
                      <span className="font-semibold">
                        {formatInventoryQuantity(quantityReserved, locale)}
                      </span>{" "}
                      unidades comprometidas.
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-800">
                      La existencia física no se reduce; solamente vuelve a
                      estar disponible.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="inventory-reservation-expiration-reason"
                  className="text-sm font-semibold text-slate-700"
                >
                  Motivo del vencimiento
                </label>

                <textarea
                  id="inventory-reservation-expiration-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition hover:border-slate-300 focus:border-red-300 focus:ring-4 focus:ring-red-50"
                />

                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">Campo obligatorio</p>

                  <p className="text-xs tabular-nums text-slate-400">
                    {reason.length}/2000
                  </p>
                </div>
              </div>

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

            <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Volver
              </button>

              <button
                type="button"
                onClick={() => void submitExpiration()}
                disabled={submitting || !cleanReason}
                className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                )}

                {submitting ? "Procesando..." : "Confirmar vencimiento"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
