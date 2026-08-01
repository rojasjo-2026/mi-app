import { LoaderCircle, Save, Tags, X } from "lucide-react";

import type {
  InventoryCategory,
  InventoryCategoryFormErrors,
  InventoryCategoryFormMode,
  InventoryCategoryFormState,
} from "../types";

type InventoryCategoryFormPanelProps = {
  open: boolean;
  mode: InventoryCategoryFormMode;
  editingCategoryId: string | null;
  form: InventoryCategoryFormState;
  errors: InventoryCategoryFormErrors;
  submitting: boolean;
  error: string;
  parentOptions: InventoryCategory[];
  onFieldChange: <TField extends keyof InventoryCategoryFormState>(
    field: TField,
    value: InventoryCategoryFormState[TField],
  ) => void;
  onSubmit: () => void;
  onClose: () => void;
};

type FieldErrorProps = {
  message?: string;
};

function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1.5 text-xs font-semibold text-rose-600">{message}</p>
  );
}

export default function InventoryCategoryFormPanel({
  open,
  mode,
  editingCategoryId,
  form,
  errors,
  submitting,
  error,
  parentOptions,
  onFieldChange,
  onSubmit,
  onClose,
}: InventoryCategoryFormPanelProps) {
  if (!open) {
    return null;
  }

  const title = mode === "create" ? "Nueva categoría" : "Editar categoría";

  const description =
    mode === "create"
      ? "Creá una categoría principal o una subcategoría para organizar los productos."
      : "Actualizá la clasificación, jerarquía y presentación de la categoría.";

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/10">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        aria-label="Cerrar formulario de categoría"
        className="absolute inset-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <Tags className="h-4.5 w-4.5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-950">{title}</h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar formulario"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <form
            id="inventory-category-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
            className="space-y-6 px-5 py-5"
          >
            <section>
              <h3 className="text-sm font-bold text-slate-950">
                Información general
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Nombre, código interno y descripción de la categoría.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Nombre
                  </span>

                  <span className="ml-1 text-rose-600">*</span>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      onFieldChange("name", event.target.value)
                    }
                    disabled={submitting}
                    maxLength={120}
                    autoFocus
                    placeholder="Ej. Motores para portón"
                    className={[
                      "mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100",
                      errors.name
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
                    ].join(" ")}
                  />

                  <FieldError message={errors.name} />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Código
                  </span>

                  <input
                    type="text"
                    value={form.categoryCode}
                    onChange={(event) =>
                      onFieldChange(
                        "categoryCode",
                        event.target.value.toUpperCase(),
                      )
                    }
                    disabled={submitting}
                    maxLength={40}
                    placeholder="Ej. MOTORES"
                    className={[
                      "mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm font-medium uppercase text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100",
                      errors.categoryCode
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
                    ].join(" ")}
                  />

                  <FieldError message={errors.categoryCode} />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Orden
                  </span>

                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) =>
                      onFieldChange("sortOrder", event.target.value)
                    }
                    disabled={submitting}
                    min={0}
                    max={1000000}
                    step={1}
                    className={[
                      "mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100",
                      errors.sortOrder
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
                    ].join(" ")}
                  />

                  <FieldError message={errors.sortOrder} />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Descripción
                  </span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      onFieldChange("description", event.target.value)
                    }
                    disabled={submitting}
                    maxLength={500}
                    rows={4}
                    placeholder="Descripción opcional de los productos que pertenecen a esta categoría."
                    className={[
                      "mt-1.5 w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100",
                      errors.description
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
                    ].join(" ")}
                  />

                  <div className="mt-1 flex items-start justify-between gap-3">
                    <FieldError message={errors.description} />

                    <span className="ml-auto text-xs font-medium text-slate-400">
                      {form.description.length}/500
                    </span>
                  </div>
                </label>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-5">
              <h3 className="text-sm font-bold text-slate-950">Jerarquía</h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Dejala sin categoría padre para crear una categoría principal.
              </p>

              <label className="mt-4 block">
                <span className="text-sm font-semibold text-slate-700">
                  Categoría padre
                </span>

                <select
                  value={form.parentCategoryId}
                  onChange={(event) =>
                    onFieldChange("parentCategoryId", event.target.value)
                  }
                  disabled={submitting}
                  className={[
                    "mt-1.5 h-10 w-full cursor-pointer rounded-lg border bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100",
                    errors.parentCategoryId
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
                  ].join(" ")}
                >
                  <option value="">Sin categoría padre</option>

                  {parentOptions
                    .filter(
                      (category) =>
                        category.inventory_category_id !== editingCategoryId,
                    )
                    .map((category) => (
                      <option
                        key={category.inventory_category_id}
                        value={category.inventory_category_id}
                        disabled={!category.is_active}
                      >
                        {category.name}
                        {category.category_code
                          ? ` (${category.category_code})`
                          : ""}
                        {!category.is_active ? " — Inactiva" : ""}
                      </option>
                    ))}
                </select>

                <FieldError message={errors.parentCategoryId} />
              </label>
            </section>

            {mode === "edit" ? (
              <section className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-800">
                  El estado de la categoría se administra desde el panel de
                  detalle.
                </p>
              </section>
            ) : null}
          </form>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="inventory-category-form"
            disabled={submitting}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-semibold text-white transition hover:border-blue-700 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              : mode === "create"
                ? "Crear categoría"
                : "Guardar cambios"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
