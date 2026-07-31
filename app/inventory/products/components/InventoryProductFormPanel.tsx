"use client";

import { LoaderCircle, PackagePlus, Save, X } from "lucide-react";

import type {
  InventoryCategory,
  InventoryProductType,
  InventoryTrackingMode,
  InventoryUnitOfMeasure,
} from "../types";

import type {
  InventoryProductFormErrors,
  InventoryProductFormMode,
  InventoryProductFormState,
} from "../utils/inventoryProductForm";

type InventoryProductFormPanelProps = {
  open: boolean;
  mode: InventoryProductFormMode;
  form: InventoryProductFormState;
  formErrors: InventoryProductFormErrors;
  serverError: string;
  serverFieldErrors: Record<string, string>;
  categories: InventoryCategory[];
  units: InventoryUnitOfMeasure[];
  unitsLoading: boolean;
  submitting: boolean;
  onChange: <K extends keyof InventoryProductFormState>(
    field: K,
    value: InventoryProductFormState[K],
  ) => void;
  onSubmit: () => void;
  onClose: () => void;
};

const productTypes: ReadonlyArray<readonly [InventoryProductType, string]> = [
  ["STOCK_ITEM", "Artículo de inventario"],
  ["CONSUMABLE", "Consumible"],
  ["SPARE_PART", "Repuesto"],
  ["ASSET", "Activo"],
  ["RAW_MATERIAL", "Materia prima"],
  ["FINISHED_GOOD", "Producto terminado"],
  ["KIT", "Kit"],
  ["SERVICE", "Servicio"],
];

const trackingModes: ReadonlyArray<readonly [InventoryTrackingMode, string]> = [
  ["NONE", "Sin seguimiento"],
  ["SERIAL", "Número de serie"],
  ["LOT", "Lote"],
];

const controlClassName =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

const labelClassName = "mb-1.5 block text-xs font-semibold text-slate-600";

type FieldErrorProps = {
  message: string;
};

function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return <p className="mt-1.5 text-xs font-medium text-rose-600">{message}</p>;
}

type CheckboxFieldProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

function CheckboxField({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: CheckboxFieldProps) {
  return (
    <label
      className={[
        "flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 disabled:cursor-not-allowed"
      />

      <span>
        <span className="block text-sm font-semibold text-slate-800">
          {label}
        </span>

        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

export default function InventoryProductFormPanel({
  open,
  mode,
  form,
  formErrors,
  serverError,
  serverFieldErrors,
  categories,
  units,
  unitsLoading,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: InventoryProductFormPanelProps) {
  if (!open) {
    return null;
  }

  const isCreate = mode === "create";

  function getError(
    field: keyof InventoryProductFormState,
    serverField?: string,
  ) {
    return (
      formErrors[field] ||
      (serverField ? serverFieldErrors[serverField] : "") ||
      ""
    );
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Cerrar formulario de producto"
        onClick={onClose}
        disabled={submitting}
        className="absolute inset-0 cursor-pointer bg-slate-950/10 disabled:cursor-not-allowed"
      />

      <aside
        aria-label={isCreate ? "Crear producto" : "Editar producto"}
        className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <PackagePlus className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
                Catálogo de inventario
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                {isCreate ? "Nuevo producto" : "Editar producto"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isCreate
                  ? "Registrá el producto y su presentación predeterminada."
                  : "Actualizá la información y las reglas generales."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar panel"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <form
          className="min-h-0 flex-1 overflow-y-auto"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-5 p-5">
            {serverError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {serverError}
              </div>
            ) : null}

            <section className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Información general
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Datos principales y clasificación.
                </p>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClassName}>Nombre *</span>

                  <input
                    type="text"
                    value={form.name}
                    maxLength={180}
                    disabled={submitting}
                    onChange={(event) => onChange("name", event.target.value)}
                    className={controlClassName}
                  />

                  <FieldError message={getError("name", "name")} />
                </label>

                <label className="block">
                  <span className={labelClassName}>Categoría</span>

                  <select
                    value={form.categoryId}
                    disabled={submitting}
                    onChange={(event) =>
                      onChange("categoryId", event.target.value)
                    }
                    className={`${controlClassName} cursor-pointer disabled:cursor-not-allowed`}
                  >
                    <option value="">Sin categoría</option>

                    {categories.map((category) => (
                      <option
                        key={category.inventory_category_id}
                        value={category.inventory_category_id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelClassName}>Tipo de producto *</span>

                  <select
                    value={form.productType}
                    disabled={submitting}
                    onChange={(event) =>
                      onChange(
                        "productType",
                        event.target.value as InventoryProductType,
                      )
                    }
                    className={`${controlClassName} cursor-pointer disabled:cursor-not-allowed`}
                  >
                    {productTypes.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelClassName}>Marca</span>

                  <input
                    type="text"
                    value={form.brand}
                    maxLength={120}
                    disabled={submitting}
                    onChange={(event) => onChange("brand", event.target.value)}
                    className={controlClassName}
                  />
                </label>

                <label className="block">
                  <span className={labelClassName}>Modelo</span>

                  <input
                    type="text"
                    value={form.model}
                    maxLength={120}
                    disabled={submitting}
                    onChange={(event) => onChange("model", event.target.value)}
                    className={controlClassName}
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className={labelClassName}>Descripción</span>

                  <textarea
                    value={form.description}
                    maxLength={1000}
                    rows={4}
                    disabled={submitting}
                    onChange={(event) =>
                      onChange("description", event.target.value)
                    }
                    className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Reglas de inventario
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  Seguimiento y comportamiento operativo.
                </p>
              </div>

              <div className="space-y-4 p-4">
                <label className="block">
                  <span className={labelClassName}>Modo de seguimiento</span>

                  <select
                    value={form.trackingMode}
                    disabled={submitting || !form.managesStock}
                    onChange={(event) =>
                      onChange(
                        "trackingMode",
                        event.target.value as InventoryTrackingMode,
                      )
                    }
                    className={`${controlClassName} cursor-pointer disabled:cursor-not-allowed`}
                  >
                    {trackingModes.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <CheckboxField
                    label="Administrar existencias"
                    description="Controla entradas, salidas y balances."
                    checked={form.managesStock}
                    disabled={submitting}
                    onChange={(checked) => onChange("managesStock", checked)}
                  />

                  <CheckboxField
                    label="Controlar vencimientos"
                    description="Permite registrar fechas de vencimiento."
                    checked={form.hasExpiration}
                    disabled={submitting || !form.managesStock}
                    onChange={(checked) => onChange("hasExpiration", checked)}
                  />

                  <CheckboxField
                    label="Permitir saldo negativo"
                    description="Autoriza existencias menores que cero."
                    checked={form.allowNegativeStock}
                    disabled={submitting || !form.managesStock}
                    onChange={(checked) =>
                      onChange("allowNegativeStock", checked)
                    }
                  />

                  <CheckboxField
                    label="Exento de impuestos"
                    description="El producto no utilizará una tasa fiscal."
                    checked={form.taxExempt}
                    disabled={submitting}
                    onChange={(checked) => onChange("taxExempt", checked)}
                  />
                </div>

                <label className="block">
                  <span className={labelClassName}>Tasa de impuesto (%)</span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.taxRate}
                    disabled={submitting || form.taxExempt}
                    onChange={(event) =>
                      onChange("taxRate", event.target.value)
                    }
                    placeholder="13"
                    className={controlClassName}
                  />

                  <FieldError message={getError("taxRate", "tax_rate")} />
                </label>
              </div>
            </section>

            {isCreate ? (
              <section className="rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Variante predeterminada
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Unidad, precio, costo y niveles iniciales.
                  </p>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClassName}>Unidad *</span>

                    <select
                      value={form.stockUnitId}
                      disabled={submitting || unitsLoading}
                      onChange={(event) =>
                        onChange("stockUnitId", event.target.value)
                      }
                      className={`${controlClassName} cursor-pointer disabled:cursor-not-allowed`}
                    >
                      <option value="">Seleccionar unidad</option>

                      {units.map((unit) => (
                        <option
                          key={unit.unit_of_measure_id}
                          value={unit.unit_of_measure_id}
                        >
                          {unit.name} ({unit.symbol || unit.code})
                        </option>
                      ))}
                    </select>

                    <FieldError
                      message={getError(
                        "stockUnitId",
                        "default_variant.stock_unit_id",
                      )}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>
                      Nombre de presentación
                    </span>

                    <input
                      type="text"
                      value={form.variantName}
                      disabled={submitting}
                      onChange={(event) =>
                        onChange("variantName", event.target.value)
                      }
                      placeholder="Presentación estándar"
                      className={controlClassName}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>Costo predeterminado</span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.defaultCost}
                      disabled={submitting}
                      onChange={(event) =>
                        onChange("defaultCost", event.target.value)
                      }
                      className={controlClassName}
                    />

                    <FieldError
                      message={getError(
                        "defaultCost",
                        "default_variant.default_cost",
                      )}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>
                      Precio predeterminado
                    </span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.defaultPrice}
                      disabled={submitting}
                      onChange={(event) =>
                        onChange("defaultPrice", event.target.value)
                      }
                      className={controlClassName}
                    />

                    <FieldError
                      message={getError(
                        "defaultPrice",
                        "default_variant.default_price",
                      )}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>Existencia mínima</span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.minimumStock}
                      disabled={submitting}
                      onChange={(event) =>
                        onChange("minimumStock", event.target.value)
                      }
                      className={controlClassName}
                    />

                    <FieldError
                      message={getError(
                        "minimumStock",
                        "default_variant.minimum_stock",
                      )}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>Existencia máxima</span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.maximumStock}
                      disabled={submitting}
                      onChange={(event) =>
                        onChange("maximumStock", event.target.value)
                      }
                      className={controlClassName}
                    />

                    <FieldError
                      message={getError(
                        "maximumStock",
                        "default_variant.maximum_stock",
                      )}
                    />
                  </label>
                </div>
              </section>
            ) : (
              <section className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Las variantes se mantienen separadas de la edición general del
                producto.
              </section>
            )}
          </div>

          <footer className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting || (isCreate && unitsLoading)}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}

              {submitting
                ? "Guardando"
                : isCreate
                  ? "Crear producto"
                  : "Guardar cambios"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
