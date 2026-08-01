import {
  CircleCheckBig,
  CircleX,
  Edit3,
  FolderPlus,
  GitBranch,
  LoaderCircle,
  Package,
  Tag,
  X,
} from "lucide-react";

import type { InventoryCategoryDetail } from "../types";
import {
  formatInventoryCategoryDateTime,
  getInventoryCategoryChildrenLabel,
  getInventoryCategoryCodeLabel,
  getInventoryCategoryProductsLabel,
  getInventoryCategoryStatusClass,
  getInventoryCategoryStatusLabel,
} from "../utils/inventoryCategoryUi";

type InventoryCategoryPreviewPanelProps = {
  open: boolean;
  detail: InventoryCategoryDetail | null;
  loading: boolean;
  error: string;
  locale: string;
  statusSubmitting?: boolean;
  statusError?: string;
  onEdit: () => void;
  onCreateChild: () => void;
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
      <div>
        <h3 className="text-sm font-bold text-slate-950">{title}</h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>

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

export default function InventoryCategoryPreviewPanel({
  open,
  detail,
  loading,
  error,
  locale,
  statusSubmitting = false,
  statusError = "",
  onEdit,
  onCreateChild,
  onToggleStatus,
  onClose,
}: InventoryCategoryPreviewPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/10">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar panel de categoría"
        className="absolute inset-0 cursor-pointer"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de categoría"
        className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Categoría seleccionada
            </p>

            <h2 className="mt-1 break-words text-lg font-bold text-slate-950">
              {detail?.name ||
                (loading ? "Cargando categoría" : "Detalle de categoría")}
            </h2>

            {detail ? (
              <p className="mt-1 break-words text-sm font-medium text-slate-500">
                {getInventoryCategoryCodeLabel(detail)}
              </p>
            ) : null}
          </div>

          <div className="col-span-2 flex flex-wrap items-center justify-end gap-2">
            {detail ? (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={loading || statusSubmitting}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={onCreateChild}
                  disabled={loading || statusSubmitting || !detail.is_active}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FolderPlus className="h-4 w-4" aria-hidden="true" />
                  Subcategoría
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
                      ? "Desactivar"
                      : "Reactivar"}
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {statusError ? (
          <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">
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
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
                {error}
              </div>
            </div>
          ) : detail ? (
            <>
              <DetailSection
                title="Información general"
                description="Identificación y descripción de la categoría."
              >
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailValue label="Nombre" value={detail.name} />

                  <DetailValue
                    label="Código"
                    value={getInventoryCategoryCodeLabel(detail)}
                  />

                  <DetailValue
                    label="Estado"
                    value={
                      <span
                        className={[
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                          getInventoryCategoryStatusClass(detail),
                        ].join(" ")}
                      >
                        {getInventoryCategoryStatusLabel(detail)}
                      </span>
                    }
                  />

                  <DetailValue label="Orden" value={detail.sort_order} />
                </dl>

                <div className="mt-4">
                  <DetailValue
                    label="Descripción"
                    value={detail.description || "Sin descripción"}
                  />
                </div>
              </DetailSection>

              <DetailSection
                title="Jerarquía"
                description="Ubicación de la categoría dentro del catálogo."
              >
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailValue
                    label="Nivel"
                    value={
                      detail.parent_category_id
                        ? "Subcategoría"
                        : "Categoría principal"
                    }
                  />

                  <DetailValue
                    label="Categoría padre"
                    value={detail.parent?.name || "Sin categoría padre"}
                  />

                  <DetailValue
                    label="Subcategorías"
                    value={getInventoryCategoryChildrenLabel(
                      detail.children_count,
                    )}
                  />

                  <DetailValue
                    label="Productos"
                    value={getInventoryCategoryProductsLabel(
                      detail.products_count,
                    )}
                  />
                </dl>
              </DetailSection>

              <DetailSection
                title="Subcategorías"
                description="Categorías organizadas directamente bajo esta categoría."
              >
                {detail.children.length > 0 ? (
                  <div className="space-y-2">
                    {detail.children.map((child) => (
                      <div
                        key={child.inventory_category_id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <GitBranch
                            className="h-4 w-4 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {child.name}
                            </p>

                            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                              {child.category_code || "Sin código"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={[
                            "shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold",
                            child.is_active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-500",
                          ].join(" ")}
                        >
                          {child.is_active ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                    <GitBranch
                      className="mx-auto h-5 w-5 text-slate-400"
                      aria-hidden="true"
                    />

                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      No tiene subcategorías.
                    </p>
                  </div>
                )}
              </DetailSection>

              <DetailSection
                title="Uso en productos"
                description="Productos clasificados directamente en esta categoría."
              >
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
                    <Package className="h-4.5 w-4.5" aria-hidden="true" />
                  </div>

                  <div>
                    <p className="text-lg font-bold text-slate-950">
                      {detail.products_count}
                    </p>

                    <p className="text-xs font-medium text-slate-500">
                      {getInventoryCategoryProductsLabel(detail.products_count)}
                    </p>
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
                    value={formatInventoryCategoryDateTime(
                      detail.created_at,
                      locale,
                    )}
                  />

                  <DetailValue
                    label="Actualizada"
                    value={formatInventoryCategoryDateTime(
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
                        {detail.inventory_category_id}
                      </span>
                    }
                  />
                </div>
              </DetailSection>
            </>
          ) : (
            <div className="flex min-h-80 items-center justify-center px-6 py-12">
              <div className="text-center">
                <Tag
                  className="mx-auto h-7 w-7 text-slate-400"
                  aria-hidden="true"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No hay una categoría seleccionada.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
