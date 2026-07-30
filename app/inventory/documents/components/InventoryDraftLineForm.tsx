"use client";

import {
  AlertTriangle,
  Check,
  Loader2,
  PackagePlus,
  Search,
} from "lucide-react";

import type { FormEventHandler } from "react";

import type {
  InventoryCatalogProduct,
  InventoryCatalogProductDetail,
  InventoryCatalogVariantDetail,
  InventoryCatalogVariantSummary,
  InventoryDraftLine,
} from "./inventoryDraftLines.types";

import { getVariantLabel } from "./inventoryDraftLines.utils";

type InventoryDraftLineFormProps = {
  editingLine: InventoryDraftLine | null;
  operationError: string;
  successMessage: string;
  search: string;
  products: InventoryCatalogProduct[];
  selectedProductId: string;
  productDetail: InventoryCatalogProductDetail | null;
  selectedVariantId: string;
  activeVariants: InventoryCatalogVariantSummary[];
  variantDetail: InventoryCatalogVariantDetail | null;
  quantity: string;
  unitCost: string;
  notes: string;
  loadingProducts: boolean;
  loadingProductDetail: boolean;
  loadingVariant: boolean;
  submitting: boolean;
  busy: boolean;
  fieldErrors: Record<string, string>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onSearchChange: (value: string) => void;
  onProductChange: (value: string) => Promise<void>;
  onVariantChange: (value: string) => Promise<void>;
  onQuantityChange: (value: string) => void;
  onUnitCostChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onCancelEditing: () => void;
};

export default function InventoryDraftLineForm({
  editingLine,
  operationError,
  successMessage,
  search,
  products,
  selectedProductId,
  productDetail,
  selectedVariantId,
  activeVariants,
  variantDetail,
  quantity,
  unitCost,
  notes,
  loadingProducts,
  loadingProductDetail,
  loadingVariant,
  submitting,
  busy,
  fieldErrors,
  onSubmit,
  onSearchChange,
  onProductChange,
  onVariantChange,
  onQuantityChange,
  onUnitCostChange,
  onNotesChange,
  onCancelEditing,
}: InventoryDraftLineFormProps) {
  const selectedUnit = editingLine
    ? editingLine.unit_of_measure
    : variantDetail?.stock_unit;

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="min-h-0 overflow-y-auto border-b border-slate-200 p-5 lg:border-b-0 lg:border-r"
    >
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
          {editingLine ? "Editar producto" : "Agregar producto"}
        </p>

        <h3 className="mt-1 text-base font-semibold text-slate-950">
          {editingLine
            ? editingLine.product_name_snapshot
            : "Selecciona un producto del catálogo"}
        </h3>

        {editingLine ? (
          <p className="mt-1 text-xs text-slate-500">
            {editingLine.variant_name_snapshot || "Variante principal"} ·{" "}
            {editingLine.unit_code_snapshot}
          </p>
        ) : null}
      </div>

      {operationError ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />

          <p>{operationError}</p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />

          <p>{successMessage}</p>
        </div>
      ) : null}

      {!editingLine ? (
        <>
          <div>
            <label
              htmlFor="draft-product-search"
              className="text-sm font-semibold text-slate-800"
            >
              Buscar producto
            </label>

            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />

              <input
                id="draft-product-search"
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                disabled={busy}
                placeholder="Nombre, marca, modelo, SKU o código"
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              />

              {loadingProducts ? (
                <Loader2
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="draft-product"
              className="text-sm font-semibold text-slate-800"
            >
              Producto
            </label>

            <select
              id="draft-product"
              value={selectedProductId}
              onChange={(event) => void onProductChange(event.target.value)}
              disabled={busy || loadingProducts}
              className="mt-2 h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecciona un producto</option>

              {products.map((product) => (
                <option
                  key={product.inventory_product_id}
                  value={product.inventory_product_id}
                >
                  {product.name}
                  {product.brand ? ` · ${product.brand}` : ""}
                  {product.model ? ` ${product.model}` : ""}
                </option>
              ))}
            </select>

            {fieldErrors.inventory_product_id ? (
              <p className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.inventory_product_id}
              </p>
            ) : null}
          </div>

          <div className="mt-4">
            <label
              htmlFor="draft-variant"
              className="text-sm font-semibold text-slate-800"
            >
              Variante
            </label>

            <select
              id="draft-variant"
              value={selectedVariantId}
              onChange={(event) => void onVariantChange(event.target.value)}
              disabled={
                busy || loadingProductDetail || loadingVariant || !productDetail
              }
              className="mt-2 h-10 w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecciona una variante</option>

              {activeVariants.map((variant) => (
                <option
                  key={variant.inventory_product_variant_id}
                  value={variant.inventory_product_variant_id}
                >
                  {getVariantLabel(variant)} · {variant.stock_unit.code}
                </option>
              ))}
            </select>

            {loadingProductDetail || loadingVariant ? (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                Cargando configuración...
              </p>
            ) : null}

            {fieldErrors.inventory_product_variant_id ? (
              <p className="mt-1 text-xs font-medium text-red-600">
                {fieldErrors.inventory_product_variant_id}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="draft-line-quantity"
            className="text-sm font-semibold text-slate-800"
          >
            Cantidad
          </label>

          <input
            id="draft-line-quantity"
            type="number"
            step="any"

            value={quantity}
            onChange={(event) => onQuantityChange(event.target.value)}
            disabled={busy}
            className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold tabular-nums text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          />

          {fieldErrors.quantity ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.quantity}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="draft-line-cost"
            className="text-sm font-semibold text-slate-800"
          >
            Costo unitario
          </label>

          <input
            id="draft-line-cost"
            type="number"
            step="any"

            value={unitCost}
            onChange={(event) => onUnitCostChange(event.target.value)}
            disabled={busy}
            className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold tabular-nums text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          />

          {fieldErrors.unit_cost ? (
            <p className="mt-1 text-xs font-medium text-red-600">
              {fieldErrors.unit_cost}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
        <p className="text-xs font-medium text-slate-500">
          Unidad de inventario
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-950">
          {editingLine
            ? `${editingLine.unit_of_measure.name} · ${editingLine.unit_code_snapshot}`
            : variantDetail
              ? `${variantDetail.stock_unit.name} · ${variantDetail.stock_unit.code}`
              : "Selecciona una variante"}
        </p>

        <p className="mt-1 text-xs text-slate-400">Factor de conversión: 1</p>
      </div>

      <div className="mt-4">
        <label
          htmlFor="draft-line-notes"
          className="text-sm font-semibold text-slate-800"
        >
          Notas del producto
        </label>

        <textarea
          id="draft-line-notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          disabled={busy}
          rows={3}
          placeholder="Información opcional sobre este producto."
          className="mt-2 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {editingLine ? (
          <button
            type="button"
            onClick={onCancelEditing}
            disabled={busy}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar edición
          </button>
        ) : null}

        <button
          type="submit"
          disabled={
            busy || (!editingLine && (!variantDetail || loadingVariant))
          }
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : editingLine ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
          )}

          {editingLine ? "Guardar cambios" : "Agregar producto"}
        </button>
      </div>
    </form>
  );
}
