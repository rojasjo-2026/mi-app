"use client";

import type { InventoryVariant } from "../../types";
import {
  formatInventoryProductMoney,
  formatInventoryProductQuantity,
} from "../../utils/inventoryProductUi";

import type { InventoryVariantManagementController } from "../hooks/useInventoryVariantManagementController";
import type { InventoryCodeType, InventoryVariantCodeSummary } from "../types";
import { toInventoryPresentationLanguage } from "../utils/inventoryVariantCodeForm";

type InventoryVariantManagementPanelProps = {
  variants: InventoryVariant[];
  variantsLoading: boolean;
  variantsError: string;
  controller: InventoryVariantManagementController;
  locale: string;
  currency: string;
};

type MetricProps = {
  label: string;
  value: string;
};

const CODE_TYPE_LABELS: Record<InventoryCodeType, string> = {
  SKU: "SKU",
  BARCODE: "Código de barras",
  QR: "Código QR",
  SUPPLIER: "Código de proveedor",
  ALTERNATE: "Código alternativo",
};

function getVariantName(variant: InventoryVariant) {
  return (
    variant.name ||
    (variant.is_default ? "Presentación estándar" : "Presentación sin nombre")
  );
}

function getUnitLabel(variant: InventoryVariant) {
  const suffix = variant.stock_unit.symbol || variant.stock_unit.code;

  return `${variant.stock_unit.name} (${suffix})`;
}

function getCodeTypeLabel(codeType: InventoryCodeType) {
  return CODE_TYPE_LABELS[codeType];
}

function Metric({ label, value }: MetricProps) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
          : "inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
      }
    >
      {active ? "Activa" : "Inactiva"}
    </span>
  );
}

function DefaultBadge() {
  return (
    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
      Predeterminada
    </span>
  );
}

function CodeRow({
  code,
  variantId,
  selected,
  loading,
  controller,
}: {
  code: InventoryVariantCodeSummary;
  variantId: string;
  selected: boolean;
  loading: boolean;
  controller: InventoryVariantManagementController;
}) {
  return (
    <article
      className={
        selected
          ? "rounded-lg border border-blue-200 bg-blue-50/40 px-3 py-3"
          : "rounded-lg border border-slate-200 bg-white px-3 py-3"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={() => {
            controller.openEditCode(variantId, code.inventory_product_code_id);
          }}
          disabled={loading}
          className="min-w-0 cursor-pointer text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="block break-all text-sm font-semibold text-slate-900">
            {code.code}
          </span>

          <span className="mt-1 block text-xs text-slate-500">
            {getCodeTypeLabel(code.code_type)}
            {code.label ? ` · ${code.label}` : ""}
          </span>
        </button>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {code.is_primary ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              Principal
            </span>
          ) : null}

          {code.is_scannable ? (
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
              Escaneable
            </span>
          ) : null}

          <StatusBadge active={code.is_active} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => {
            controller.openEditCode(variantId, code.inventory_product_code_id);
          }}
          disabled={loading}
          className="h-8 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Editar código
        </button>

        <button
          type="button"
          onClick={() => {
            void controller.changeCodeStatus(code);
          }}
          disabled={loading}
          className="h-8 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {code.is_active ? "Desactivar" : "Reactivar"}
        </button>
      </div>
    </article>
  );
}

export default function InventoryVariantManagementPanel({
  variants,
  variantsLoading,
  variantsError,
  controller,
  locale,
  currency,
}: InventoryVariantManagementPanelProps) {
  const selectedVariantId = controller.selectedVariantId;

  const selectedVariant =
    controller.variantDetail || controller.selectedVariant;

  const codes = controller.variantDetail?.codes || [];

  const loading = controller.mutationLoading || variantsLoading;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">
            Presentaciones y códigos
          </h2>

          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Administrá presentaciones, unidades, precios y códigos de
            identificación.
          </p>
        </div>

        <button
          type="button"
          onClick={controller.openCreateVariant}
          disabled={loading}
          className="h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Nueva presentación
        </button>
      </header>

      {controller.successMessage ? (
        <div
          aria-live="polite"
          className="mx-4 mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {toInventoryPresentationLanguage(controller.successMessage)}
        </div>
      ) : null}

      {controller.mutationError ? (
        <div
          role="alert"
          className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {toInventoryPresentationLanguage(controller.mutationError)}
        </div>
      ) : null}

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Presentaciones
            </h3>

            <p className="mt-0.5 text-xs text-slate-500">
              Seleccioná una presentación para ver y administrar sus códigos.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {variantsLoading ? "…" : variants.length}
          </span>
        </div>

        {variantsLoading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Cargando presentaciones…
          </div>
        ) : null}

        {!variantsLoading && variantsError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800"
          >
            {toInventoryPresentationLanguage(variantsError)}
          </div>
        ) : null}

        {!variantsLoading && !variantsError && variants.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No hay presentaciones configuradas
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Creá la primera presentación para comenzar.
            </p>

            <button
              type="button"
              onClick={controller.openCreateVariant}
              disabled={loading}
              className="mt-4 h-9 cursor-pointer whitespace-nowrap rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Crear presentación
            </button>
          </div>
        ) : null}

        {!variantsLoading && !variantsError && variants.length > 0 ? (
          <div className="space-y-3">
            {variants.map((variant) => {
              const variantId = variant.inventory_product_variant_id;

              const selected = selectedVariantId === variantId;

              const activeVariant =
                selected && selectedVariant ? selectedVariant : variant;

              return (
                <article
                  key={variantId}
                  className={
                    selected
                      ? "overflow-hidden rounded-lg border border-blue-200 bg-blue-50/20"
                      : "overflow-hidden rounded-lg border border-slate-200 bg-white"
                  }
                >
                  <div className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          controller.selectVariant(variantId);
                        }}
                        aria-pressed={selected}
                        className="min-w-0 cursor-pointer text-left"
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="break-words text-sm font-semibold text-slate-950">
                            {getVariantName(variant)}
                          </span>

                          {variant.is_default ? <DefaultBadge /> : null}

                          <StatusBadge active={variant.is_active} />
                        </span>

                        <span className="mt-1 block text-xs text-slate-500">
                          {getUnitLabel(variant)}
                        </span>
                      </button>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className="text-xs font-medium text-slate-500">
                          Precio predeterminado
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {variant.default_price === null
                            ? "Sin precio"
                            : formatInventoryProductMoney(
                                variant.default_price,
                                locale,
                                currency,
                              )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
                      <Metric
                        label="Costo"
                        value={
                          variant.default_cost === null
                            ? "Sin costo"
                            : formatInventoryProductMoney(
                                variant.default_cost,
                                locale,
                                currency,
                              )
                        }
                      />

                      <Metric
                        label="Mínimo"
                        value={formatInventoryProductQuantity(
                          variant.minimum_stock,
                          locale,
                          variant.stock_unit.decimal_scale,
                        )}
                      />

                      <Metric
                        label="Máximo"
                        value={
                          variant.maximum_stock === null
                            ? "Sin límite"
                            : formatInventoryProductQuantity(
                                variant.maximum_stock,
                                locale,
                                variant.stock_unit.decimal_scale,
                              )
                        }
                      />

                      <Metric
                        label="Balances"
                        value={String(variant.stock_balances_count)}
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">
                        {variant.codes_count} códigos ·{" "}
                        {variant.stock_balances_count} balances
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            controller.selectVariant(variantId);
                          }}
                          disabled={loading}
                          className="h-8 cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {selected ? "Códigos abiertos" : "Ver códigos"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            controller.openEditVariant(variant);
                          }}
                          disabled={loading}
                          className="h-8 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Editar presentación
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            void controller.changeVariantStatus(variant);
                          }}
                          disabled={loading}
                          className="h-8 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {variant.is_active ? "Desactivar" : "Reactivar"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {selected ? (
                    <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-4">
                      {controller.variantLoading ? (
                        <div className="py-6 text-center text-sm text-slate-500">
                          Cargando presentación…
                        </div>
                      ) : null}

                      {!controller.variantLoading && controller.variantError ? (
                        <div
                          role="alert"
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800"
                        >
                          {toInventoryPresentationLanguage(
                            controller.variantError,
                          )}
                        </div>
                      ) : null}

                      {!controller.variantLoading &&
                      !controller.variantError &&
                      activeVariant ? (
                        <div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900">
                                Códigos de esta presentación
                              </h4>

                              <p className="mt-1 text-xs text-slate-500">
                                SKU, códigos de barras, QR y referencias
                                alternativas.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                controller.openCreateCode(variantId);
                              }}
                              disabled={loading || !activeVariant.is_active}
                              className="h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Nuevo código
                            </button>
                          </div>

                          {codes.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-5">
                              <p className="text-sm font-semibold text-slate-800">
                                Esta presentación todavía no tiene códigos
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                Podés agregar un SKU, código de barras, QR o
                                referencia alternativa.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-4 space-y-2">
                              {codes.map((code) => (
                                <CodeRow
                                  key={code.inventory_product_code_id}
                                  code={code}
                                  variantId={variantId}
                                  selected={
                                    controller.selectedCodeId ===
                                    code.inventory_product_code_id
                                  }
                                  loading={loading}
                                  controller={controller}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
