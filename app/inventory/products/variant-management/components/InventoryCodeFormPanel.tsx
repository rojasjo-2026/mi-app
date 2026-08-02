"use client";

import type { FormEvent } from "react";

import type { InventoryVariantUnit } from "../../types";

import type { InventoryVariantManagementController } from "../hooks/useInventoryVariantManagementController";
import { toInventoryPresentationLanguage } from "../utils/inventoryVariantCodeForm";

import type { InventoryCodeFormState, InventoryCodeType } from "../types";

type InventoryCodeFormPanelProps = {
  units: InventoryVariantUnit[];
  controller: InventoryVariantManagementController;
};

type FieldErrorProps = {
  message?: string;
};

const CODE_TYPE_OPTIONS: Array<{
  value: InventoryCodeType;
  label: string;
  description: string;
}> = [
  {
    value: "SKU",
    label: "SKU",
    description: "Código interno del producto.",
  },
  {
    value: "BARCODE",
    label: "Código de barras",
    description: "Código diseñado para escaneo.",
  },
  {
    value: "QR",
    label: "Código QR",
    description: "Identificador en formato QR.",
  },
  {
    value: "SUPPLIER",
    label: "Código de proveedor",
    description: "Referencia utilizada por el proveedor.",
  },
  {
    value: "ALTERNATE",
    label: "Código alternativo",
    description: "Otra referencia válida del producto.",
  },
];

function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

function getUnitLabel(unit: InventoryVariantUnit) {
  const suffix = unit.symbol || unit.code;

  return `${unit.name} (${suffix})`;
}

function getSelectedCodeTypeDescription(codeType: InventoryCodeType) {
  return (
    CODE_TYPE_OPTIONS.find((option) => option.value === codeType)
      ?.description || ""
  );
}

export default function InventoryCodeFormPanel({
  units,
  controller,
}: InventoryCodeFormPanelProps) {
  const mode = controller.codeFormMode;

  if (!mode) {
    return null;
  }

  const form = controller.codeForm;

  const errors = controller.codeFormErrors;

  const loading = controller.mutationLoading;

  const loadingDetail = mode === "edit" && controller.codeLoading;

  const selectedVariant =
    controller.variantDetail || controller.selectedVariant;

  const editingPrimaryCode =
    mode === "edit" && controller.codeDetail?.is_primary === true;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void controller.submitCodeForm();
  }

  function changeField<K extends keyof InventoryCodeFormState>(
    field: K,
    value: InventoryCodeFormState[K],
  ) {
    controller.changeCodeField(field, value);
  }

  function handleUnitChange(unitOfMeasureId: string) {
    changeField("unitOfMeasureId", unitOfMeasureId);

    if (!unitOfMeasureId) {
      changeField("quantityInStockUnit", "1");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/10">
      <button
        type="button"
        aria-label="Cerrar formulario de código"
        onClick={controller.closeCodeForm}
        disabled={loading}
        className="absolute inset-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Códigos
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {mode === "create" ? "Nuevo código" : "Editar código"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Presentación asociada:{" "}
              {selectedVariant?.name ||
                (selectedVariant?.is_default
                  ? "Presentación estándar"
                  : "Presentación sin nombre")}
            </p>
          </div>

          <button
            type="button"
            onClick={controller.closeCodeForm}
            disabled={loading}
            className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cerrar
          </button>
        </header>

        {loadingDetail ? (
          <div className="flex flex-1 items-center justify-center px-5 py-10 text-sm text-slate-500">
            Cargando código…
          </div>
        ) : null}

        {!loadingDetail && mode === "edit" && controller.codeError ? (
          <div className="flex-1 px-5 py-5">
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800"
            >
              {toInventoryPresentationLanguage(controller.codeError)}
            </div>
          </div>
        ) : null}

        {!loadingDetail && !controller.codeError ? (
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {controller.mutationError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {toInventoryPresentationLanguage(controller.mutationError)}
                </div>
              ) : null}

              <section>
                <h3 className="text-sm font-semibold text-slate-900">
                  Identificación
                </h3>

                <div className="mt-3 space-y-4">
                  <div>
                    <label
                      htmlFor="inventory-code-value"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Código
                    </label>

                    <input
                      id="inventory-code-value"
                      type="text"
                      maxLength={255}
                      value={form.code}
                      onChange={(event) => {
                        changeField("code", event.target.value);
                      }}
                      disabled={loading}
                      placeholder="Ejemplo: MOT-PORTON-001"
                      autoComplete="off"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />

                    <div className="mt-1 flex items-start justify-between gap-3">
                      <FieldError message={errors.code} />

                      <span className="ml-auto text-xs text-slate-400">
                        {form.code.length}/255
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="inventory-code-type"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Tipo de código
                    </label>

                    <select
                      id="inventory-code-type"
                      value={form.codeType}
                      onChange={(event) => {
                        changeField(
                          "codeType",
                          event.target.value as InventoryCodeType,
                        );
                      }}
                      disabled={loading}
                      className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      {CODE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <p className="mt-1 text-xs text-slate-500">
                      {getSelectedCodeTypeDescription(form.codeType)}
                    </p>

                    <FieldError message={errors.codeType} />
                  </div>

                  <div>
                    <label
                      htmlFor="inventory-code-label"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Etiqueta
                    </label>

                    <input
                      id="inventory-code-label"
                      type="text"
                      maxLength={160}
                      value={form.label}
                      onChange={(event) => {
                        changeField("label", event.target.value);
                      }}
                      disabled={loading}
                      placeholder="Ejemplo: Código del fabricante"
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />

                    <div className="mt-1 flex items-start justify-between gap-3">
                      <FieldError message={errors.label} />

                      <span className="ml-auto text-xs text-slate-400">
                        {form.label.length}/160
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  Conversión de unidad
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Permite que un código represente una caja, paquete u otra
                  presentación.
                </p>

                <div className="mt-3 space-y-4">
                  <div>
                    <label
                      htmlFor="inventory-code-unit"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Unidad representada
                    </label>

                    <select
                      id="inventory-code-unit"
                      value={form.unitOfMeasureId}
                      onChange={(event) => {
                        handleUnitChange(event.target.value);
                      }}
                      disabled={loading}
                      className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">Misma unidad de inventario</option>

                      {units.map((unit) => (
                        <option
                          key={unit.unit_of_measure_id}
                          value={unit.unit_of_measure_id}
                        >
                          {getUnitLabel(unit)}
                        </option>
                      ))}
                    </select>

                    <FieldError message={errors.unitOfMeasureId} />
                  </div>

                  <div>
                    <label
                      htmlFor="inventory-code-quantity"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Cantidad en unidad de inventario
                    </label>

                    <input
                      id="inventory-code-quantity"
                      type="text"
                      inputMode="decimal"
                      value={form.quantityInStockUnit}
                      onChange={(event) => {
                        changeField("quantityInStockUnit", event.target.value);
                      }}
                      disabled={loading || !form.unitOfMeasureId}
                      className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      {form.unitOfMeasureId
                        ? "Ejemplo: una caja puede representar 12 unidades."
                        : "Sin una unidad alternativa, la cantidad es 1."}
                    </p>

                    <FieldError message={errors.quantityInStockUnit} />
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-900">
                  Comportamiento
                </h3>

                <div className="mt-3 space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={form.isPrimary}
                      onChange={(event) => {
                        changeField("isPrimary", event.target.checked);
                      }}
                      disabled={loading || editingPrimaryCode}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 disabled:cursor-not-allowed"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Código principal
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-500">
                        {editingPrimaryCode
                          ? "Este código ya es el principal. Para reemplazarlo, marcá primero otro código de esta presentación como principal."
                          : "Se mostrará como referencia principal de esta presentación."}
                      </span>
                    </span>
                  </label>

                  <FieldError message={errors.isPrimary} />

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={form.isScannable}
                      onChange={(event) => {
                        changeField("isScannable", event.target.checked);
                      }}
                      disabled={loading}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 disabled:cursor-not-allowed"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Permitir escaneo
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-500">
                        El código podrá utilizarse para entradas y salidas por
                        escáner.
                      </span>
                    </span>
                  </label>

                  <FieldError message={errors.isScannable} />
                </div>
              </section>
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
              <button
                type="button"
                onClick={controller.closeCodeForm}
                disabled={loading}
                className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="h-9 cursor-pointer rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Guardando…"
                  : mode === "create"
                    ? "Crear código"
                    : "Guardar cambios"}
              </button>
            </footer>
          </form>
        ) : null}
      </aside>
    </div>
  );
}
