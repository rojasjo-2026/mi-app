import { LoaderCircle, Save, Scale, X } from "lucide-react";

import type {
  InventoryUnitFormErrors,
  InventoryUnitFormMode,
  InventoryUnitFormState,
} from "../types";

type InventoryUnitFormPanelProps = {
  open: boolean;
  mode: InventoryUnitFormMode;
  form: InventoryUnitFormState;
  errors: InventoryUnitFormErrors;
  submitting: boolean;
  error: string;
  onFieldChange: <TField extends keyof InventoryUnitFormState>(
    field: TField,
    value: InventoryUnitFormState[TField],
  ) => void;
  onSubmit: () => void;
  onClose: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1.5 text-xs font-semibold text-rose-600">{message}</p>
  );
}

export default function InventoryUnitFormPanel({
  open,
  mode,
  form,
  errors,
  submitting,
  error,
  onFieldChange,
  onSubmit,
  onClose,
}: InventoryUnitFormPanelProps) {
  if (!open) {
    return null;
  }

  const decimalScale = Math.min(Math.max(Number(form.decimalScale) || 0, 0), 6);

  const exampleValue = form.allowsDecimal
    ? (1 + 1 / 10 ** decimalScale).toFixed(decimalScale)
    : "1";

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/10">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        aria-label="Cerrar formulario de unidad"
        className="absolute inset-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={mode === "create" ? "Nueva unidad" : "Editar unidad"}
        className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <Scale className="h-4 w-4" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-lg font-bold text-slate-950">
                {mode === "create" ? "Nueva unidad" : "Editar unidad"}
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Definí cómo se registrarán las cantidades de los productos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar formulario"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
            id="inventory-unit-form"
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
                Identificación utilizada en productos, existencias y
                movimientos.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Código *
                  </span>

                  <input
                    type="text"
                    value={form.code}
                    onChange={(event) =>
                      onFieldChange("code", event.target.value.toUpperCase())
                    }
                    disabled={submitting}
                    maxLength={20}
                    autoFocus
                    placeholder="Ej. KG"
                    className={[
                      "mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm font-semibold uppercase text-slate-800 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100",
                      errors.code
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
                    ].join(" ")}
                  />

                  <FieldError message={errors.code} />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Símbolo
                  </span>

                  <input
                    type="text"
                    value={form.symbol}
                    onChange={(event) =>
                      onFieldChange("symbol", event.target.value)
                    }
                    disabled={submitting}
                    maxLength={20}
                    placeholder="Ej. kg"
                    className={[
                      "mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100",
                      errors.symbol
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
                    ].join(" ")}
                  />

                  <FieldError message={errors.symbol} />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Nombre *
                  </span>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      onFieldChange("name", event.target.value)
                    }
                    disabled={submitting}
                    maxLength={100}
                    placeholder="Ej. Kilogramo"
                    className={[
                      "mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100",
                      errors.name
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
                    ].join(" ")}
                  />

                  <FieldError message={errors.name} />
                </label>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-5">
              <h3 className="text-sm font-bold text-slate-950">
                Configuración de cantidades
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Indicá si acepta cantidades fraccionadas y su precisión.
              </p>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                <input
                  type="checkbox"
                  checked={form.allowsDecimal}
                  onChange={(event) =>
                    onFieldChange("allowsDecimal", event.target.checked)
                  }
                  disabled={submitting}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 disabled:cursor-not-allowed"
                />

                <span>
                  <span className="block text-sm font-bold text-slate-900">
                    Permitir cantidades decimales
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Útil para peso, longitud, volumen y cantidades parciales.
                  </span>
                </span>
              </label>

              <FieldError message={errors.allowsDecimal} />

              <label className="mt-4 block">
                <span className="text-sm font-semibold text-slate-700">
                  Cantidad de decimales
                </span>

                <input
                  type="number"
                  value={form.decimalScale}
                  onChange={(event) =>
                    onFieldChange("decimalScale", event.target.value)
                  }
                  disabled={submitting || !form.allowsDecimal}
                  min={0}
                  max={6}
                  step={1}
                  className={[
                    "mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
                    errors.decimalScale
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                      : "border-slate-200 focus:border-blue-400 focus:ring-blue-100",
                  ].join(" ")}
                />

                <FieldError message={errors.decimalScale} />
              </label>
            </section>

            <section className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4">
              <p className="text-xs font-semibold text-blue-700">
                Ejemplo de cantidad
              </p>

              <p className="mt-1 text-lg font-bold text-blue-950">
                {exampleValue}
                {form.symbol.trim() ? ` ${form.symbol.trim()}` : ""}
              </p>
            </section>

            {mode === "edit" ? (
              <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                El estado se administra desde el panel de detalle.
              </section>
            ) : null}
          </form>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="inventory-unit-form"
            disabled={submitting}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                ? "Crear unidad"
                : "Guardar cambios"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
