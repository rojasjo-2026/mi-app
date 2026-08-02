"use client";

import type { FormEvent } from "react";

import type { InventoryVariantUnit } from "../../types";

import type { InventoryVariantManagementController } from "../hooks/useInventoryVariantManagementController";
import { toInventoryPresentationLanguage } from "../utils/inventoryVariantCodeForm";

type InventoryVariantFormPanelProps = {
  units: InventoryVariantUnit[];
  controller: InventoryVariantManagementController;
};

type FieldErrorProps = {
  message?: string;
};

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

export default function InventoryVariantFormPanel({
  units,
  controller,
}: InventoryVariantFormPanelProps) {
  const mode = controller.variantFormMode;

  if (!mode) {
    return null;
  }

  const form = controller.variantForm;

  const errors = controller.variantFormErrors;

  const loading = controller.mutationLoading;

  const editingDefaultVariant =
    mode === "edit" && controller.selectedVariant?.is_default === true;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void controller.submitVariantForm();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/10">
      <button
        type="button"
        aria-label="Cerrar formulario de presentación"
        onClick={controller.closeVariantForm}
        disabled={loading}
        className="absolute inset-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Presentaciones
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {mode === "create" ? "Nueva presentación" : "Editar presentación"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configurá la presentación, unidad, precios y límites de
              inventario.
            </p>
          </div>

          <button
            type="button"
            onClick={controller.closeVariantForm}
            disabled={loading}
            className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cerrar
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
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
                    htmlFor="inventory-variant-unit"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Unidad de inventario
                  </label>

                  <select
                    id="inventory-variant-unit"
                    value={form.stockUnitId}
                    onChange={(event) => {
                      controller.changeVariantField(
                        "stockUnitId",
                        event.target.value,
                      );
                    }}
                    disabled={loading}
                    className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">Seleccione una unidad</option>

                    {units.map((unit) => (
                      <option
                        key={unit.unit_of_measure_id}
                        value={unit.unit_of_measure_id}
                      >
                        {getUnitLabel(unit)}
                      </option>
                    ))}
                  </select>

                  <FieldError message={errors.stockUnitId} />
                </div>

                <div>
                  <label
                    htmlFor="inventory-variant-name"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Nombre de la presentación
                  </label>

                  <input
                    id="inventory-variant-name"
                    type="text"
                    maxLength={160}
                    value={form.name}
                    onChange={(event) => {
                      controller.changeVariantField("name", event.target.value);
                    }}
                    disabled={loading}
                    placeholder="Ejemplo: Caja de 12 unidades"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <div className="mt-1 flex items-start justify-between gap-3">
                    <FieldError message={errors.name} />

                    <span className="ml-auto text-xs text-slate-400">
                      {form.name.length}/160
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Valores comerciales
              </h3>

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="inventory-variant-cost"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Costo predeterminado
                  </label>

                  <input
                    id="inventory-variant-cost"
                    type="text"
                    inputMode="decimal"
                    value={form.defaultCost}
                    onChange={(event) => {
                      controller.changeVariantField(
                        "defaultCost",
                        event.target.value,
                      );
                    }}
                    disabled={loading}
                    placeholder="0.0000"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <FieldError message={errors.defaultCost} />
                </div>

                <div>
                  <label
                    htmlFor="inventory-variant-price"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Precio predeterminado
                  </label>

                  <input
                    id="inventory-variant-price"
                    type="text"
                    inputMode="decimal"
                    value={form.defaultPrice}
                    onChange={(event) => {
                      controller.changeVariantField(
                        "defaultPrice",
                        event.target.value,
                      );
                    }}
                    disabled={loading}
                    placeholder="0.00"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <FieldError message={errors.defaultPrice} />
                </div>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Control de inventario
              </h3>

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="inventory-variant-minimum"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Inventario mínimo
                  </label>

                  <input
                    id="inventory-variant-minimum"
                    type="text"
                    inputMode="decimal"
                    value={form.minimumStock}
                    onChange={(event) => {
                      controller.changeVariantField(
                        "minimumStock",
                        event.target.value,
                      );
                    }}
                    disabled={loading}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <FieldError message={errors.minimumStock} />
                </div>

                <div>
                  <label
                    htmlFor="inventory-variant-maximum"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Inventario máximo
                  </label>

                  <input
                    id="inventory-variant-maximum"
                    type="text"
                    inputMode="decimal"
                    value={form.maximumStock}
                    onChange={(event) => {
                      controller.changeVariantField(
                        "maximumStock",
                        event.target.value,
                      );
                    }}
                    disabled={loading}
                    placeholder="Sin límite"
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <FieldError message={errors.maximumStock} />
                </div>

                <div>
                  <label
                    htmlFor="inventory-variant-sort-order"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Orden
                  </label>

                  <input
                    id="inventory-variant-sort-order"
                    type="number"
                    min={0}
                    max={1000000}
                    step={1}
                    value={form.sortOrder}
                    onChange={(event) => {
                      controller.changeVariantField(
                        "sortOrder",
                        event.target.value,
                      );
                    }}
                    disabled={loading}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <FieldError message={errors.sortOrder} />
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) => {
                    controller.changeVariantField(
                      "isDefault",
                      event.target.checked,
                    );
                  }}
                  disabled={loading || editingDefaultVariant}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 disabled:cursor-not-allowed"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Presentación principal
                  </span>

                  <span className="mt-0.5 block text-xs text-slate-500">
                    Se utilizará como presentación principal del producto.
                  </span>

                  {editingDefaultVariant ? (
                    <span className="mt-1 block text-xs font-medium text-amber-700">
                      Para reemplazarla, marcá otra presentación como principal.
                    </span>
                  ) : null}
                </span>
              </label>

              <FieldError message={errors.isDefault} />
            </section>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
            <button
              type="button"
              onClick={controller.closeVariantForm}
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
                  ? "Crear presentación"
                  : "Guardar cambios"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
