import {
  Calculator,
  CircleCheckBig,
  CircleX,
  Edit3,
  Hash,
  LoaderCircle,
  Scale,
  X,
} from "lucide-react";

import type { InventoryUnitOfMeasure } from "../types";
import {
  formatInventoryUnitDateTime,
  getInventoryUnitExample,
  getInventoryUnitPrecisionLabel,
  getInventoryUnitQuantityTypeLabel,
  getInventoryUnitStatusClass,
  getInventoryUnitStatusLabel,
  getInventoryUnitSymbolLabel,
} from "../utils/inventoryUnitUi";

type InventoryUnitPreviewPanelProps = {
  open: boolean;
  detail: InventoryUnitOfMeasure | null;
  loading: boolean;
  error: string;
  locale: string;
  statusSubmitting?: boolean;
  statusError?: string;
  onEdit: () => void;
  onToggleStatus?: () => void;
  onClose: () => void;
};

type DetailSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function DetailSection({ title, description, children }: DetailSectionProps) {
  return (
    <section className="border-b border-slate-200 px-5 py-5 last:border-b-0">
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>

      <div className="mt-4">{children}</div>
    </section>
  );
}

type DetailValueProps = {
  label: string;
  value: React.ReactNode;
};

function DetailValue({ label, value }: DetailValueProps) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>

      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </dd>
    </div>
  );
}

export default function InventoryUnitPreviewPanel({
  open,
  detail,
  loading,
  error,
  locale,
  statusSubmitting = false,
  statusError = "",
  onEdit,
  onToggleStatus,
  onClose,
}: InventoryUnitPreviewPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/10">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar panel de unidad"
        className="absolute inset-0 cursor-pointer"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de unidad"
        className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <header className="shrink-0 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Unidad seleccionada
              </p>

              <h2 className="mt-1 break-words text-lg font-bold text-slate-950">
                {detail?.name ||
                  (loading ? "Cargando unidad" : "Detalle de unidad")}
              </h2>

              {detail ? (
                <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                  {detail.code}
                  {detail.symbol ? " · " + detail.symbol : ""}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel"
              className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {detail ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onEdit}
                disabled={loading || statusSubmitting}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Edit3 className="h-4 w-4" aria-hidden="true" />
                Editar unidad
              </button>

              <button
                type="button"
                onClick={onToggleStatus}
                disabled={!onToggleStatus || loading || statusSubmitting}
                className={[
                  "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                  detail.is_active
                    ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                ].join(" ")}
              >
                {statusSubmitting ? (
                  <LoaderCircle
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : detail.is_active ? (
                  <CircleX className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <CircleCheckBig className="h-4 w-4" aria-hidden="true" />
                )}

                {statusSubmitting
                  ? "Procesando"
                  : detail.is_active
                    ? "Desactivar unidad"
                    : "Reactivar unidad"}
              </button>
            </div>
          ) : null}
        </header>

        {statusError ? (
          <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">
            {statusError}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex min-h-80 items-center justify-center px-6 py-12">
              <div className="text-center">
                <LoaderCircle
                  className="mx-auto h-7 w-7 animate-spin text-blue-600"
                  aria-hidden="true"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Cargando información…
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="px-5 py-8">
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
                {error}
              </div>
            </div>
          ) : detail ? (
            <>
              <DetailSection
                title="Información general"
                description="Identificación y estado de la unidad."
              >
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailValue label="Nombre" value={detail.name} />

                  <DetailValue label="Código" value={detail.code} />

                  <DetailValue
                    label="Símbolo"
                    value={getInventoryUnitSymbolLabel(detail)}
                  />

                  <DetailValue
                    label="Estado"
                    value={
                      <span
                        className={[
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                          getInventoryUnitStatusClass(detail),
                        ].join(" ")}
                      >
                        {getInventoryUnitStatusLabel(detail)}
                      </span>
                    }
                  />
                </dl>
              </DetailSection>

              <DetailSection
                title="Configuración de cantidades"
                description="Reglas utilizadas al registrar existencias y movimientos."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <article className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                        <Hash className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Tipo de cantidad
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {getInventoryUnitQuantityTypeLabel(detail)}
                        </p>
                      </div>
                    </div>
                  </article>

                  <article className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                        <Calculator className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Precisión
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {getInventoryUnitPrecisionLabel(detail)}
                        </p>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Scale
                      className="h-5 w-5 shrink-0 text-blue-700"
                      aria-hidden="true"
                    />

                    <div>
                      <p className="text-xs font-semibold text-blue-700">
                        Ejemplo de registro
                      </p>

                      <p className="mt-1 text-lg font-bold text-blue-950">
                        {getInventoryUnitExample(detail)}
                      </p>
                    </div>
                  </div>
                </div>
              </DetailSection>

              <DetailSection
                title="Auditoría"
                description="Fechas de registro y última actualización."
              >
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailValue
                    label="Creada"
                    value={formatInventoryUnitDateTime(
                      detail.created_at,
                      locale,
                    )}
                  />

                  <DetailValue
                    label="Actualizada"
                    value={formatInventoryUnitDateTime(
                      detail.updated_at,
                      locale,
                    )}
                  />
                </dl>

                <div className="mt-4">
                  <DetailValue
                    label="Identificador"
                    value={
                      <span className="font-mono text-xs font-medium text-slate-600">
                        {detail.unit_of_measure_id}
                      </span>
                    }
                  />
                </div>
              </DetailSection>
            </>
          ) : (
            <div className="flex min-h-80 items-center justify-center px-6 py-12">
              <div className="text-center">
                <Scale
                  className="mx-auto h-7 w-7 text-slate-400"
                  aria-hidden="true"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No hay una unidad seleccionada.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
