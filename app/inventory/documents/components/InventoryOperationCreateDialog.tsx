"use client";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  FilePlus2,
  Loader2,
  MapPin,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { useInventoryOperationLocations } from "../hooks/useInventoryOperationLocations";

import type {
  InventoryApiResponse,
  InventoryDocumentDetail,
  InventoryDocumentType,
} from "../types";

type InventoryOperationCreateDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (operation: InventoryDocumentDetail) => void;
};

type OperationTypeConfiguration = {
  value: InventoryDocumentType;
  label: string;
  description: string;
  requiresSource: boolean;
  requiresDestination: boolean;
};

type OperationFormState = {
  documentType: InventoryDocumentType;
  documentDate: string;
  sourceLocationId: string;
  destinationLocationId: string;
  referenceNumber: string;
  notes: string;
};

const OPERATION_TYPES: OperationTypeConfiguration[] = [
  {
    value: "RECEIPT",
    label: "Entrada de inventario",
    description: "Registra productos que ingresan a una ubicación.",
    requiresSource: false,
    requiresDestination: true,
  },
  {
    value: "ISSUE",
    label: "Salida de inventario",
    description: "Registra productos que salen de una ubicación.",
    requiresSource: true,
    requiresDestination: false,
  },
  {
    value: "TRANSFER",
    label: "Transferencia entre ubicaciones",
    description: "Traslada productos desde una ubicación hacia otra.",
    requiresSource: true,
    requiresDestination: true,
  },
  {
    value: "ADJUSTMENT_INCREASE",
    label: "Ajuste para aumentar existencias",
    description: "Corrige una diferencia aumentando la cantidad registrada.",
    requiresSource: false,
    requiresDestination: true,
  },
  {
    value: "ADJUSTMENT_DECREASE",
    label: "Ajuste para reducir existencias",
    description: "Corrige una diferencia reduciendo la cantidad registrada.",
    requiresSource: true,
    requiresDestination: false,
  },
  {
    value: "RETURN_IN",
    label: "Devolución recibida",
    description: "Registra productos devueltos que vuelven a una ubicación.",
    requiresSource: false,
    requiresDestination: true,
  },
  {
    value: "RETURN_OUT",
    label: "Devolución enviada",
    description: "Registra productos devueltos que salen de una ubicación.",
    requiresSource: true,
    requiresDestination: false,
  },
  {
    value: "OPENING_BALANCE",
    label: "Existencia inicial",
    description:
      "Registra la cantidad inicial disponible al comenzar a utilizar el inventario.",
    requiresSource: false,
    requiresDestination: true,
  },
];

function getTodayInputValue() {
  const now = new Date();

  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60 * 1000,
  );

  return localDate.toISOString().slice(0, 10);
}

function createInitialForm(): OperationFormState {
  return {
    documentType: "RECEIPT",
    documentDate: getTodayInputValue(),
    sourceLocationId: "",
    destinationLocationId: "",
    referenceNumber: "",
    notes: "",
  };
}

export default function InventoryOperationCreateDialog({
  open,
  onClose,
  onCreated,
}: InventoryOperationCreateDialogProps) {
  const {
    locations,
    loading: loadingLocations,
    error: locationsError,
  } = useInventoryOperationLocations(open);

  const [form, setForm] = useState<OperationFormState>(createInitialForm);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [submitError, setSubmitError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const selectedConfiguration = useMemo(
    () =>
      OPERATION_TYPES.find((option) => option.value === form.documentType) ??
      OPERATION_TYPES[0],
    [form.documentType],
  );

  const defaultLocationId =
    locations.find((location) => location.is_default)?.inventory_location_id ??
    locations[0]?.inventory_location_id ??
    "";

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(createInitialForm());
    setFieldErrors({});
    setSubmitError("");
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open || !defaultLocationId) {
      return;
    }

    setForm((current) => {
      const configuration =
        OPERATION_TYPES.find(
          (option) => option.value === current.documentType,
        ) ?? OPERATION_TYPES[0];

      return {
        ...current,

        sourceLocationId:
          configuration.requiresSource && !current.sourceLocationId
            ? defaultLocationId
            : current.sourceLocationId,

        destinationLocationId:
          configuration.requiresDestination && !current.destinationLocationId
            ? defaultLocationId
            : current.destinationLocationId,
      };
    });
  }, [defaultLocationId, open]);

  useEffect(() => {
    if (
      !open ||
      form.documentType !== "TRANSFER" ||
      !form.sourceLocationId ||
      form.sourceLocationId !== form.destinationLocationId
    ) {
      return;
    }

    const alternateDestinationLocationId =
      locations.find(
        (location) => location.inventory_location_id !== form.sourceLocationId,
      )?.inventory_location_id ?? "";

    setForm((current) => ({
      ...current,
      destinationLocationId: alternateDestinationLocationId,
    }));
  }, [
    form.destinationLocationId,
    form.documentType,
    form.sourceLocationId,
    locations,
    open,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, submitting]);

  if (!open) {
    return null;
  }

  function handleTypeChange(documentType: InventoryDocumentType) {
    const configuration =
      OPERATION_TYPES.find((option) => option.value === documentType) ??
      OPERATION_TYPES[0];

    setFieldErrors({});
    setSubmitError("");

    setForm((current) => ({
      ...current,
      documentType,

      sourceLocationId: configuration.requiresSource
        ? current.sourceLocationId || defaultLocationId
        : "",

      destinationLocationId: configuration.requiresDestination
        ? current.destinationLocationId || defaultLocationId
        : "",
    }));
  }

  function validateForm() {
    const errors: Record<string, string> = {};

    if (!form.documentDate) {
      errors.document_date = "Selecciona la fecha de la operación.";
    }

    if (selectedConfiguration.requiresSource && !form.sourceLocationId) {
      errors.source_location_id = "Selecciona la ubicación de origen.";
    }

    if (
      selectedConfiguration.requiresDestination &&
      !form.destinationLocationId
    ) {
      errors.destination_location_id = "Selecciona la ubicación de destino.";
    }

    if (
      form.documentType === "TRANSFER" &&
      form.sourceLocationId &&
      form.destinationLocationId &&
      form.sourceLocationId === form.destinationLocationId
    ) {
      errors.destination_location_id =
        "Selecciona una ubicación diferente del origen.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const cleanReferenceNumber = form.referenceNumber.trim();

      const cleanNotes = form.notes.trim();

      const response = await fetch("/api/inventory/documents", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          document_type: form.documentType,

          source_location_id: selectedConfiguration.requiresSource
            ? form.sourceLocationId
            : null,

          destination_location_id: selectedConfiguration.requiresDestination
            ? form.destinationLocationId
            : null,

          document_date: `${form.documentDate}T12:00:00.000Z`,

          reference_number: cleanReferenceNumber || null,

          idempotency_key: `inventory-operation-${crypto.randomUUID()}`,

          notes: cleanNotes || null,
        }),
      });

      const result: InventoryApiResponse<InventoryDocumentDetail> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        setFieldErrors(result.errors ?? {});

        throw new Error(result.message || "No se pudo crear la operación.");
      }

      onCreated(result.data);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al crear la operación.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar formulario"
        disabled={submitting}
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-slate-950/10 disabled:cursor-not-allowed"
      />

      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <FilePlus2 className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Inventario
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              Nueva operación
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Se guardará como borrador para que puedas agregar los productos.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          {locationsError ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              <p>{locationsError}</p>
            </div>
          ) : null}

          {submitError ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              <p>{submitError}</p>
            </div>
          ) : null}

          <section>
            <label
              htmlFor="inventory-operation-type"
              className="text-sm font-semibold text-slate-800"
            >
              Tipo de operación
            </label>

            <select
              id="inventory-operation-type"
              value={form.documentType}
              onChange={(event) =>
                handleTypeChange(event.target.value as InventoryDocumentType)
              }
              disabled={submitting}
              className="mt-2 h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {OPERATION_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {selectedConfiguration.description}
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="inventory-operation-date"
                className="flex items-center gap-2 text-sm font-semibold text-slate-800"
              >
                <CalendarDays
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                Fecha de la operación
              </label>

              <input
                id="inventory-operation-date"
                type="date"
                value={form.documentDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    documentDate: event.target.value,
                  }))
                }
                disabled={submitting}
                className="mt-2 h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              />

              {fieldErrors.document_date ? (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {fieldErrors.document_date}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="inventory-operation-reference"
                className="text-sm font-semibold text-slate-800"
              >
                Número de referencia
              </label>

              <input
                id="inventory-operation-reference"
                type="text"
                value={form.referenceNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    referenceNumber: event.target.value,
                  }))
                }
                disabled={submitting}
                placeholder="Factura, orden o solicitud"
                className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              />

              {fieldErrors.reference_number ? (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {fieldErrors.reference_number}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />

              <h3 className="text-sm font-semibold text-slate-950">
                Ubicaciones
              </h3>
            </div>

            {loadingLocations ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Cargando ubicaciones...
              </div>
            ) : locations.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-slate-500">
                No existen ubicaciones activas que permitan almacenar
                inventario.
              </p>
            ) : (
              <div
                className={[
                  "mt-4 grid gap-4",
                  selectedConfiguration.requiresSource &&
                  selectedConfiguration.requiresDestination
                    ? "sm:grid-cols-[1fr_auto_1fr] sm:items-end"
                    : "sm:grid-cols-1",
                ].join(" ")}
              >
                {selectedConfiguration.requiresSource ? (
                  <div>
                    <label
                      htmlFor="inventory-operation-source"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Ubicación de origen
                    </label>

                    <select
                      id="inventory-operation-source"
                      value={form.sourceLocationId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          sourceLocationId: event.target.value,
                        }))
                      }
                      disabled={submitting || loadingLocations}
                      className="mt-2 h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecciona una ubicación</option>

                      {locations.map((location) => (
                        <option
                          key={location.inventory_location_id}
                          value={location.inventory_location_id}
                        >
                          {location.name} · {location.location_code}
                        </option>
                      ))}
                    </select>

                    {fieldErrors.source_location_id ? (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {fieldErrors.source_location_id}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {selectedConfiguration.requiresSource &&
                selectedConfiguration.requiresDestination ? (
                  <div className="hidden h-10 items-center justify-center text-slate-400 sm:flex">
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </div>
                ) : null}

                {selectedConfiguration.requiresDestination ? (
                  <div>
                    <label
                      htmlFor="inventory-operation-destination"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Ubicación de destino
                    </label>

                    <select
                      id="inventory-operation-destination"
                      value={form.destinationLocationId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          destinationLocationId: event.target.value,
                        }))
                      }
                      disabled={submitting || loadingLocations}
                      className="mt-2 h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Selecciona una ubicación</option>

                      {locations.map((location) => (
                        <option
                          key={location.inventory_location_id}
                          value={location.inventory_location_id}
                          disabled={
                            form.documentType === "TRANSFER" &&
                            location.inventory_location_id ===
                              form.sourceLocationId
                          }
                        >
                          {location.name} · {location.location_code}
                        </option>
                      ))}
                    </select>

                    {fieldErrors.destination_location_id ? (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {fieldErrors.destination_location_id}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <section>
            <label
              htmlFor="inventory-operation-notes"
              className="text-sm font-semibold text-slate-800"
            >
              Notas
            </label>

            <textarea
              id="inventory-operation-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              disabled={submitting}
              rows={4}
              placeholder="Agrega información útil para identificar o procesar esta operación."
              className="mt-2 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            />

            {fieldErrors.notes ? (
              <p className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.notes}
              </p>
            ) : null}
          </section>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={submitting || loadingLocations || locations.length === 0}
            className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            )}
            Crear borrador
          </button>
        </footer>
      </form>
    </div>
  );
}
