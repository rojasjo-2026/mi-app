"use client";

import type { FormEvent } from "react";
import { Building2, MapPin, Network, Save, Warehouse, X } from "lucide-react";

import type {
  InventoryLocation,
  InventoryLocationFormErrors,
  InventoryLocationFormMode,
  InventoryLocationFormState,
} from "../types";
import { INVENTORY_LOCATION_TYPE_OPTIONS } from "../utils/inventoryLocationUi";

type InventoryLocationFormPanelProps = {
  mode: InventoryLocationFormMode;
  formState: InventoryLocationFormState;
  errors: InventoryLocationFormErrors;
  submitError: string | null;
  saving: boolean;
  parentOptions: InventoryLocation[];
  editingLocationId: string | null;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  onFieldChange: <Field extends keyof InventoryLocationFormState>(
    field: Field,
    value: InventoryLocationFormState[Field],
  ) => void;
};

type FieldErrorProps = {
  message?: string;
};

function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return <p className="mt-1.5 text-xs font-semibold text-red-600">{message}</p>;
}

const INPUT_CLASS =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

const SELECT_CLASS =
  "h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

export default function InventoryLocationFormPanel({
  mode,
  formState,
  errors,
  submitError,
  saving,
  parentOptions,
  editingLocationId,
  onClose,
  onSubmit,
  onFieldChange,
}: InventoryLocationFormPanelProps) {
  const availableParents = parentOptions.filter(
    (location) =>
      location.is_active &&
      location.inventory_location_id !== editingLocationId,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/10">
      <button
        type="button"
        aria-label="Cerrar formulario"
        onClick={onClose}
        disabled={saving}
        className="absolute inset-0 cursor-pointer disabled:cursor-not-allowed"
      />

      <aside className="relative z-10 flex h-full w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl">
        <header className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                {mode === "create" ? "Nueva ubicación" : "Editar ubicación"}
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                {mode === "create"
                  ? "Crear ubicación de inventario"
                  : "Actualizar ubicación de inventario"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Definí cómo se utilizará dentro de existencias, movimientos y
                transferencias.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Cerrar formulario"
              className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {submitError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {submitError}
              </div>
            ) : null}

            <section className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-slate-500" />

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Información general
                    </h3>

                    <p className="text-xs text-slate-500">
                      Identificación y clasificación de la ubicación.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Código *
                  </span>

                  <input
                    type="text"
                    value={formState.locationCode}
                    maxLength={40}
                    placeholder="Ej. BOD-01"
                    onChange={(event) =>
                      onFieldChange(
                        "locationCode",
                        event.target.value.toUpperCase(),
                      )
                    }
                    className={INPUT_CLASS}
                  />

                  <FieldError message={errors.locationCode} />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tipo *
                  </span>

                  <select
                    value={formState.locationType}
                    onChange={(event) =>
                      onFieldChange(
                        "locationType",
                        event.target
                          .value as InventoryLocationFormState["locationType"],
                      )
                    }
                    className={SELECT_CLASS}
                  >
                    {INVENTORY_LOCATION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Nombre *
                  </span>

                  <input
                    type="text"
                    value={formState.name}
                    maxLength={120}
                    placeholder="Ej. Bodega principal"
                    onChange={(event) =>
                      onFieldChange("name", event.target.value)
                    }
                    className={INPUT_CLASS}
                  />

                  <FieldError message={errors.name} />
                </label>

                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Descripción
                  </span>

                  <textarea
                    value={formState.description}
                    maxLength={500}
                    rows={3}
                    placeholder="Descripción operativa de la ubicación"
                    onChange={(event) =>
                      onFieldChange("description", event.target.value)
                    }
                    className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />

                  <FieldError message={errors.description} />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Network className="size-4 text-slate-500" />

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Jerarquía
                    </h3>

                    <p className="text-xs text-slate-500">
                      Relación con una ubicación superior.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Ubicación padre
                  </span>

                  <select
                    value={formState.parentLocationId}
                    onChange={(event) =>
                      onFieldChange("parentLocationId", event.target.value)
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="">Sin ubicación padre</option>

                    {availableParents.map((location) => (
                      <option
                        key={location.inventory_location_id}
                        value={location.inventory_location_id}
                      >
                        {location.name} · {location.location_code}
                      </option>
                    ))}
                  </select>

                  <p className="mt-1.5 text-xs text-slate-500">
                    Dejala vacía para crear una ubicación principal.
                  </p>
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Orden
                  </span>

                  <input
                    type="number"
                    min={0}
                    max={1000000}
                    step={1}
                    value={formState.sortOrder}
                    onChange={(event) =>
                      onFieldChange("sortOrder", event.target.value)
                    }
                    className={INPUT_CLASS}
                  />

                  <FieldError message={errors.sortOrder} />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Warehouse className="size-4 text-slate-500" />

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Configuración operativa
                    </h3>

                    <p className="text-xs text-slate-500">
                      Comportamiento dentro del inventario.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formState.allowsStock}
                    onChange={(event) =>
                      onFieldChange("allowsStock", event.target.checked)
                    }
                    className="mt-0.5 size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span>
                    <span className="block text-sm font-bold text-slate-900">
                      Permitir existencias
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      Habilita balances, reservas y movimientos de productos.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formState.isDefault}
                    onChange={(event) =>
                      onFieldChange("isDefault", event.target.checked)
                    }
                    className="mt-0.5 size-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span>
                    <span className="block text-sm font-bold text-slate-900">
                      Ubicación predeterminada
                    </span>

                    <span className="mt-1 block text-xs text-slate-500">
                      Al activarla reemplazará cualquier otra ubicación
                      predeterminada.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-slate-500" />

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Ubicación física
                    </h3>

                    <p className="text-xs text-slate-500">
                      País, dirección y coordenadas opcionales.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    País
                  </span>

                  <input
                    type="text"
                    value={formState.countryCode}
                    maxLength={2}
                    placeholder="CR"
                    onChange={(event) =>
                      onFieldChange(
                        "countryCode",
                        event.target.value.toUpperCase(),
                      )
                    }
                    className={INPUT_CLASS}
                  />

                  <FieldError message={errors.countryCode} />
                </label>

                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Dirección
                  </span>

                  <input
                    type="text"
                    value={formState.addressLine}
                    maxLength={300}
                    placeholder="Dirección física"
                    onChange={(event) =>
                      onFieldChange("addressLine", event.target.value)
                    }
                    className={INPUT_CLASS}
                  />

                  <FieldError message={errors.addressLine} />
                </label>

                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Punto de referencia
                  </span>

                  <input
                    type="text"
                    value={formState.referencePoint}
                    maxLength={300}
                    placeholder="Ej. Frente a la entrada principal"
                    onChange={(event) =>
                      onFieldChange("referencePoint", event.target.value)
                    }
                    className={INPUT_CLASS}
                  />

                  <FieldError message={errors.referencePoint} />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Latitud
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={formState.latitude}
                    placeholder="9.9281000"
                    onChange={(event) =>
                      onFieldChange("latitude", event.target.value)
                    }
                    className={INPUT_CLASS}
                  />

                  <FieldError message={errors.latitude} />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                    Longitud
                  </span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={formState.longitude}
                    placeholder="-84.0907000"
                    onChange={(event) =>
                      onFieldChange("longitude", event.target.value)
                    }
                    className={INPUT_CLASS}
                  />

                  <FieldError message={errors.longitude} />
                </label>
              </div>
            </section>
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="size-4" />

              {saving
                ? "Guardando..."
                : mode === "create"
                  ? "Crear ubicación"
                  : "Guardar cambios"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
