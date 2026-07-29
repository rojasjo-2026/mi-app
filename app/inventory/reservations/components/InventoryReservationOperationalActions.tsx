"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Loader2,
  PackageMinus,
  RotateCcw,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import type {
  InventoryApiResponse,
  InventoryReservationDetail,
  InventoryReservationStatus,
} from "../types";

import { formatInventoryQuantity } from "../utils/inventoryReservationUi";

type OperationalAction = "consume" | "release";

type InventoryReservationOperationalActionsProps = {
  reservation: InventoryReservationDetail;

  locale: string;

  onCompleted: (nextStatus: InventoryReservationStatus) => void;
};

type ConsumptionResponseData = {
  inventory_document_id: string;

  outcome: string;

  reservation: InventoryReservationDetail;
};

type MutationResponseData =
  InventoryReservationDetail | ConsumptionResponseData;

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

function isReservationDetail(
  value: unknown,
): value is InventoryReservationDetail {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.inventory_reservation_id === "string" &&
    typeof candidate.status === "string"
  );
}

function getReservationFromMutation(value: unknown) {
  if (isReservationDetail(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    reservation?: unknown;
  };

  return isReservationDetail(candidate.reservation)
    ? candidate.reservation
    : null;
}

function createOperationKey(reservationId: string) {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return ["inventory-ui", reservationId, Date.now(), randomPart].join("-");
}

export default function InventoryReservationOperationalActions({
  reservation,
  locale,
  onCompleted,
}: InventoryReservationOperationalActionsProps) {
  const [activeAction, setActiveAction] = useState<OperationalAction | null>(
    null,
  );

  const [lineQuantities, setLineQuantities] = useState<Record<string, string>>(
    {},
  );

  const [reason, setReason] = useState("");

  const [operationKey, setOperationKey] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const eligibleLines = useMemo(
    () =>
      reservation.lines.filter((line) => Number(line.quantity_reserved) > 0),
    [reservation.lines],
  );

  const totalReserved = eligibleLines.reduce(
    (total, line) => total + Number(line.quantity_reserved),
    0,
  );

  const selectedConsumption = eligibleLines.reduce(
    (total, line) =>
      total +
      (Number(lineQuantities[line.inventory_reservation_line_id] || 0) || 0),
    0,
  );

  const cleanReason = reason.trim();

  const hasOperationalActions =
    reservation.actions.can_consume || reservation.actions.can_release;

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

  function fillAllQuantities() {
    setLineQuantities(
      Object.fromEntries(
        eligibleLines.map((line) => [
          line.inventory_reservation_line_id,
          line.quantity_reserved,
        ]),
      ),
    );
  }

  function openConsumeDialog() {
    fillAllQuantities();

    setReason("");

    setError("");

    setSuccessMessage("");

    setOperationKey(createOperationKey(reservation.inventory_reservation_id));

    setActiveAction("consume");
  }

  function openReleaseDialog() {
    setReason("");

    setError("");

    setSuccessMessage("");

    setOperationKey("");

    setActiveAction("release");
  }

  function closeDialog() {
    if (submitting) {
      return;
    }

    setActiveAction(null);

    setError("");

    setReason("");
  }

  function validateConsumptionLines() {
    const selectedLines = eligibleLines
      .map((line) => {
        const rawQuantity = (
          lineQuantities[line.inventory_reservation_line_id] || ""
        ).trim();

        const quantity = Number(rawQuantity);

        return {
          line,
          rawQuantity,
          quantity,
        };
      })
      .filter((item) => item.quantity > 0);

    if (selectedLines.length === 0) {
      throw new Error("Ingresá al menos una cantidad para consumir.");
    }

    for (const item of selectedLines) {
      const maximumQuantity = Number(item.line.quantity_reserved);

      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new Error("Las cantidades deben ser mayores que cero.");
      }

      if (item.quantity > maximumQuantity) {
        throw new Error(
          `La cantidad de ${item.line.variant.product.name} supera las ${formatInventoryQuantity(
            item.line.quantity_reserved,
            locale,
          )} unidades reservadas.`,
        );
      }
    }

    return selectedLines.map((item) => ({
      inventory_reservation_line_id: item.line.inventory_reservation_line_id,

      quantity: item.rawQuantity,
    }));
  }

  async function submitAction() {
    if (!activeAction) {
      return;
    }

    if (!cleanReason) {
      setError(
        activeAction === "consume"
          ? "Debés indicar el motivo del consumo."
          : "Debés indicar el motivo de la liberación.",
      );

      return;
    }

    try {
      setSubmitting(true);

      setError("");

      let endpoint: string;

      let body: Record<string, unknown>;

      if (activeAction === "consume") {
        const lines = validateConsumptionLines();

        endpoint = `/api/inventory/reservations/${reservation.inventory_reservation_id}/consume`;

        body = {
          idempotency_key: operationKey,

          consumption_reason: cleanReason,

          consumed_by: "clarius-inventory-ui",

          lines,
        };
      } else {
        endpoint = `/api/inventory/reservations/${reservation.inventory_reservation_id}/release`;

        body = {
          release_reason: cleanReason,

          released_by: "clarius-inventory-ui",
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(body),
      });

      let result: InventoryApiResponse<MutationResponseData>;

      try {
        result = await response.json();
      } catch {
        throw new Error("El servidor devolvió una respuesta no válida.");
      }

      if (!response.ok || !result.success) {
        throw new Error(
          getResponseError(
            result,
            activeAction === "consume"
              ? "No se pudo registrar el consumo."
              : "No se pudo liberar la reserva.",
          ),
        );
      }

      const updatedReservation = getReservationFromMutation(result.data);

      if (!updatedReservation) {
        throw new Error(
          "La operación terminó, pero no devolvió el estado actualizado.",
        );
      }

      setSuccessMessage(
        result.message ||
          (activeAction === "consume"
            ? "Consumo registrado correctamente."
            : "Reserva liberada correctamente."),
      );

      setActiveAction(null);

      setReason("");

      setLineQuantities({});

      onCompleted(updatedReservation.status);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Ocurrió un error al procesar la operación.",
      );
    } finally {
      setSubmitting(false);
    }
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

      {hasOperationalActions ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {reservation.actions.can_consume ? (
            <button
              type="button"
              onClick={openConsumeDialog}
              disabled={submitting}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PackageMinus className="h-4 w-4" aria-hidden="true" />
              Consumir inventario
            </button>
          ) : null}

          {reservation.actions.can_release ? (
            <button
              type="button"
              onClick={openReleaseDialog}
              disabled={submitting}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-amber-200 bg-white px-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              Liberar pendiente
            </button>
          ) : null}
        </div>
      ) : null}

      {activeAction ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
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
            aria-labelledby="inventory-reservation-operational-action-title"
            className="relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-5 py-4">
              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                  activeAction === "consume"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-700",
                ].join(" ")}
              >
                {activeAction === "consume" ? (
                  <PackageMinus className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ArrowDownToLine className="h-5 w-5" aria-hidden="true" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Operación de inventario
                </p>

                <h3
                  id="inventory-reservation-operational-action-title"
                  className="mt-1 text-base font-semibold text-slate-950"
                >
                  {activeAction === "consume"
                    ? "Consumir inventario reservado"
                    : "Liberar cantidad pendiente"}
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

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {activeAction === "consume" ? (
                <>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-900">
                      Esta operación descontará existencia física.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-emerald-800">
                      Se generará un documento de salida contabilizado y la
                      reserva quedará parcial o totalmente consumida.
                    </p>
                  </div>

                  <section>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Cantidades por línea
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Podés consumir todo o solamente una parte.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={fillAllQuantities}
                        disabled={submitting}
                        className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        Usar todo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {eligibleLines.map((line) => {
                        const inputId = `consume-${line.inventory_reservation_line_id}`;

                        return (
                          <article
                            key={line.inventory_reservation_line_id}
                            className="rounded-lg border border-slate-200 bg-white p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-950">
                                  {line.variant.product.name}
                                </p>

                                <p className="mt-1 truncate text-xs font-medium text-slate-500">
                                  {line.variant.name || "Variante principal"} ·{" "}
                                  {line.location.name}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  Reservado pendiente:{" "}
                                  <span className="font-semibold text-slate-600">
                                    {formatInventoryQuantity(
                                      line.quantity_reserved,
                                      locale,
                                    )}
                                  </span>
                                </p>
                              </div>

                              <div className="w-32 shrink-0">
                                <label
                                  htmlFor={inputId}
                                  className="text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                                >
                                  A consumir
                                </label>

                                <input
                                  id={inputId}
                                  type="number"
                                  min="0"
                                  max={line.quantity_reserved}
                                  step="any"
                                  inputMode="decimal"
                                  value={
                                    lineQuantities[
                                      line.inventory_reservation_line_id
                                    ] || ""
                                  }
                                  onChange={(event) =>
                                    setLineQuantities((current) => ({
                                      ...current,

                                      [line.inventory_reservation_line_id]:
                                        event.target.value,
                                    }))
                                  }
                                  className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-right text-sm font-semibold tabular-nums text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                                />
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Reservado pendiente
                      </p>

                      <p className="mt-1 text-lg font-semibold text-slate-950">
                        {formatInventoryQuantity(totalReserved, locale)}
                      </p>
                    </div>

                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                        Consumo seleccionado
                      </p>

                      <p className="mt-1 text-lg font-semibold text-emerald-800">
                        {formatInventoryQuantity(selectedConsumption, locale)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    Se liberarán{" "}
                    {formatInventoryQuantity(totalReserved, locale)} unidades
                    reservadas.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-amber-800">
                    La existencia física no se reduce. La cantidad vuelve a
                    quedar disponible para otras reservas u operaciones.
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="inventory-reservation-operational-reason"
                  className="text-sm font-semibold text-slate-700"
                >
                  {activeAction === "consume"
                    ? "Motivo del consumo"
                    : "Motivo de la liberación"}
                </label>

                <textarea
                  id="inventory-reservation-operational-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder={
                    activeAction === "consume"
                      ? "Ejemplo: materiales utilizados durante la instalación..."
                      : "Ejemplo: trabajo reprogramado o material ya no requerido..."
                  }
                  className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />

                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">Campo obligatorio</p>

                  <p className="text-xs tabular-nums text-slate-400">
                    {reason.length}/1000
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
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Volver
              </button>

              <button
                type="button"
                onClick={() => void submitAction()}
                disabled={
                  submitting ||
                  !cleanReason ||
                  (activeAction === "consume" && selectedConsumption <= 0)
                }
                className={[
                  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
                  activeAction === "consume"
                    ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-100"
                    : "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-100",
                ].join(" ")}
              >
                {submitting ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : activeAction === "consume" ? (
                  <PackageMinus className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
                )}

                {submitting
                  ? "Procesando..."
                  : activeAction === "consume"
                    ? "Confirmar consumo"
                    : "Confirmar liberación"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
