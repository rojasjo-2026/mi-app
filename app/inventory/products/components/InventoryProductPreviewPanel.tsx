"use client";

import {
  Boxes,
  CircleCheckBig,
  CircleX,
  Layers3,
  LoaderCircle,
  Package,
  Pencil,
  ReceiptText,
  Tags,
  TriangleAlert,
  X,
} from "lucide-react";

import type { InventoryProductDetail, InventoryVariant } from "../types";

import {
  formatInventoryProductDateTime,
  formatInventoryProductMoney,
  formatInventoryProductQuantity,
  getInventoryProductBrandModel,
  getInventoryProductStatusClass,
  getInventoryProductStatusLabel,
  getInventoryProductTaxLabel,
  getInventoryProductTypeLabel,
  getInventoryTrackingModeLabel,
  getInventoryVariantLabel,
  getInventoryVariantUnitLabel,
} from "../utils/inventoryProductUi";

type InventoryProductPreviewPanelProps = {
  open: boolean;
  detail: InventoryProductDetail | null;
  detailLoading: boolean;
  detailError: string;
  variants: InventoryVariant[];
  variantsLoading: boolean;
  variantsError: string;
  locale: string;
  currency: string;
  onEdit: () => void;
  statusSubmitting?: boolean;
  statusError?: string;
  onToggleStatus?: () => void;
  onClose: () => void;
};

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>

      <dd className="break-words text-sm font-medium text-slate-800">
        {value}
      </dd>
    </div>
  );
}

type BooleanRuleProps = {
  label: string;
  enabled: boolean;
  enabledText: string;
  disabledText: string;
};

function BooleanRule({
  label,
  enabled,
  enabledText,
  disabledText,
}: BooleanRuleProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      {enabled ? (
        <CircleCheckBig
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
          aria-hidden="true"
        />
      ) : (
        <CircleX
          className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
          aria-hidden="true"
        />
      )}

      <div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>

        <p className="mt-1 text-sm font-semibold text-slate-800">
          {enabled ? enabledText : disabledText}
        </p>
      </div>
    </div>
  );
}

export default function InventoryProductPreviewPanel({
  open,
  detail,
  detailLoading,
  detailError,
  variants,
  variantsLoading,
  variantsError,
  locale,
  currency,
  onEdit,
  statusSubmitting = false,
  statusError = "",
  onToggleStatus,
  onClose,
}: InventoryProductPreviewPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar detalle del producto"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-slate-950/10"
      />

      <aside
        aria-label="Detalle del producto seleccionado"
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Package className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
                Producto seleccionado
              </p>

              <h2 className="mt-1 break-words text-lg font-bold text-slate-950">
                {detail?.name || "Detalle del producto"}
              </h2>

              {detail ? (
                <p className="mt-1 text-xs text-slate-500">
                  {getInventoryProductBrandModel(detail)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              disabled={!detail || detailLoading}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar producto
            </button>

            {detail ? (
              <button
                type="button"
                onClick={onToggleStatus}
                disabled={!onToggleStatus || detailLoading || statusSubmitting}
                className={[
                  "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                  detail.is_active
                    ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                    : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
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
                    ? "Desactivar producto"
                    : "Reactivar producto"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
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
          {detailLoading ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <LoaderCircle
                className="h-8 w-8 animate-spin text-blue-600"
                aria-hidden="true"
              />

              <p className="mt-4 text-sm font-semibold text-slate-800">
                Cargando producto
              </p>
            </div>
          ) : null}

          {!detailLoading && detailError ? (
            <div className="m-5 rounded-lg border border-rose-200 bg-rose-50 p-5 text-center">
              <TriangleAlert
                className="mx-auto h-8 w-8 text-rose-600"
                aria-hidden="true"
              />

              <p className="mt-3 text-sm font-bold text-rose-900">
                No se pudo cargar el producto
              </p>

              <p className="mt-1 text-sm leading-6 text-rose-700">
                {detailError}
              </p>
            </div>
          ) : null}

          {!detailLoading && !detailError && detail ? (
            <div className="space-y-5 p-5">
              <section className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Información general
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Clasificación y datos principales.
                    </p>
                  </div>

                  <span
                    className={[
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                      getInventoryProductStatusClass(detail),
                    ].join(" ")}
                  >
                    {getInventoryProductStatusLabel(detail)}
                  </span>
                </div>

                <dl className="px-4">
                  <DetailRow label="Nombre" value={detail.name} />

                  <DetailRow
                    label="Tipo"
                    value={getInventoryProductTypeLabel(detail.product_type)}
                  />

                  <DetailRow
                    label="Seguimiento"
                    value={getInventoryTrackingModeLabel(detail.tracking_mode)}
                  />

                  <DetailRow
                    label="Marca y modelo"
                    value={getInventoryProductBrandModel(detail)}
                  />

                  <DetailRow
                    label="Descripción"
                    value={detail.description || "Sin descripción"}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                  <Tags className="h-4 w-4 text-cyan-600" aria-hidden="true" />

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Categoría e impuestos
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Clasificación comercial y fiscal.
                    </p>
                  </div>
                </div>

                <dl className="px-4">
                  <DetailRow
                    label="Categoría"
                    value={detail.category?.name || "Sin categoría"}
                  />

                  <DetailRow
                    label="Código"
                    value={detail.category?.category_code || "Sin código"}
                  />

                  <DetailRow
                    label="Impuesto"
                    value={getInventoryProductTaxLabel(detail, locale)}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                  <Boxes
                    className="h-4 w-4 text-violet-600"
                    aria-hidden="true"
                  />

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Reglas de inventario
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Comportamiento operativo del producto.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <BooleanRule
                    label="Existencias"
                    enabled={detail.manages_stock}
                    enabledText="Administra existencias"
                    disabledText="No administra existencias"
                  />

                  <BooleanRule
                    label="Vencimiento"
                    enabled={detail.has_expiration}
                    enabledText="Controla vencimientos"
                    disabledText="Sin control de vencimiento"
                  />

                  <BooleanRule
                    label="Saldo negativo"
                    enabled={detail.allow_negative_stock}
                    enabledText="Permite saldo negativo"
                    disabledText="No permite saldo negativo"
                  />

                  <BooleanRule
                    label="Exención fiscal"
                    enabled={detail.tax_exempt}
                    enabledText="Producto exento"
                    disabledText="Producto gravado"
                  />
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Layers3
                      className="h-4 w-4 text-amber-600"
                      aria-hidden="true"
                    />

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Variantes
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Presentaciones, costos y niveles.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {variants.length}
                  </span>
                </div>

                {variantsLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm font-semibold text-slate-500">
                    <LoaderCircle
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Cargando variantes
                  </div>
                ) : null}

                {!variantsLoading && variantsError ? (
                  <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {variantsError}
                  </div>
                ) : null}

                {!variantsLoading && !variantsError && variants.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    Este producto no tiene variantes.
                  </div>
                ) : null}

                {!variantsLoading && !variantsError && variants.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {variants.map((variant) => (
                      <article
                        key={variant.inventory_product_variant_id}
                        className="p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-slate-900">
                                {getInventoryVariantLabel(variant)}
                              </p>

                              {variant.is_default ? (
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                  Predeterminada
                                </span>
                              ) : null}

                              {!variant.is_active ? (
                                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                                  Inactiva
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {getInventoryVariantUnitLabel(variant)}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-xs font-medium text-slate-500">
                              Precio predeterminado
                            </p>

                            <p className="mt-1 font-bold text-slate-950">
                              {variant.default_price === null
                                ? "No definido"
                                : formatInventoryProductMoney(
                                    variant.default_price,
                                    locale,
                                    currency,
                                  )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Costo
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {variant.default_cost === null
                                ? "No definido"
                                : formatInventoryProductMoney(
                                    variant.default_cost,
                                    locale,
                                    currency,
                                  )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Mínimo
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatInventoryProductQuantity(
                                variant.minimum_stock,
                                locale,
                                variant.stock_unit.decimal_scale,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Máximo
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {variant.maximum_stock === null
                                ? "Sin límite"
                                : formatInventoryProductQuantity(
                                    variant.maximum_stock,
                                    locale,
                                    variant.stock_unit.decimal_scale,
                                  )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>{variant.codes_count} códigos</span>

                          <span>{variant.stock_balances_count} balances</span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                  <ReceiptText
                    className="h-4 w-4 text-slate-500"
                    aria-hidden="true"
                  />

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Auditoría
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Fechas de registro y actualización.
                    </p>
                  </div>
                </div>

                <dl className="px-4">
                  <DetailRow
                    label="Creado"
                    value={formatInventoryProductDateTime(
                      detail.created_at,
                      locale,
                    )}
                  />

                  <DetailRow
                    label="Actualizado"
                    value={formatInventoryProductDateTime(
                      detail.updated_at,
                      locale,
                    )}
                  />

                  <DetailRow
                    label="Identificador"
                    value={detail.inventory_product_id}
                  />
                </dl>
              </section>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
