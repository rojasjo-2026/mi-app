"use client";

import { ChevronLeft, ChevronRight, Layers3, Package } from "lucide-react";

import type { InventoryProduct } from "../types";

import {
  formatInventoryProductDateTime,
  getInventoryProductBrandModel,
  getInventoryProductStatusClass,
  getInventoryProductStatusLabel,
  getInventoryProductTypeLabel,
  getInventoryTrackingModeLabel,
} from "../utils/inventoryProductUi";

type InventoryProductTableProps = {
  items: InventoryProduct[];
  selectedProductId: string | null;
  page: number;
  pageSize: number;
  locale: string;
  loading: boolean;
  onSelect: (productId: string) => void;
  onPageChange: (page: number) => void;
};

export default function InventoryProductTable({
  items,
  selectedProductId,
  page,
  pageSize,
  locale,
  loading,
  onSelect,
  onPageChange,
}: InventoryProductTableProps) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const safePage = Math.min(Math.max(page, 1), totalPages);

  const startIndex = (safePage - 1) * pageSize;

  const visibleItems = items.slice(startIndex, startIndex + pageSize);

  const firstItem = items.length === 0 ? 0 : startIndex + 1;

  const lastItem = Math.min(startIndex + visibleItems.length, items.length);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Producto
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Clasificación
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Categoría
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Variantes
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Administración
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Estado
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Actualización
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {visibleItems.map((product) => {
              const isSelected =
                selectedProductId === product.inventory_product_id;

              return (
                <tr
                  key={product.inventory_product_id}
                  onClick={() => onSelect(product.inventory_product_id)}
                  className={[
                    "cursor-pointer transition",
                    isSelected ? "bg-blue-50" : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <td className="min-w-72 px-4 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Package className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {getInventoryProductBrandModel(product)}
                        </p>

                        {product.description ? (
                          <p className="mt-1 line-clamp-2 max-w-md text-xs leading-5 text-slate-500">
                            {product.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="min-w-52 px-4 py-4 align-top">
                    <p className="text-sm font-semibold text-slate-800">
                      {getInventoryProductTypeLabel(product.product_type)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {getInventoryTrackingModeLabel(product.tracking_mode)}
                    </p>
                  </td>

                  <td className="min-w-48 px-4 py-4 align-top">
                    {product.category ? (
                      <>
                        <p className="text-sm font-semibold text-slate-800">
                          {product.category.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {product.category.category_code || "Sin código"}
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Sin categoría
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 align-top">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                      <Layers3
                        className="h-3.5 w-3.5 text-slate-500"
                        aria-hidden="true"
                      />

                      <span className="text-sm font-bold text-slate-800">
                        {product.variants_count}
                      </span>
                    </div>
                  </td>

                  <td className="min-w-48 px-4 py-4 align-top">
                    <p className="text-sm font-semibold text-slate-800">
                      {product.manages_stock
                        ? "Con existencias"
                        : "Sin existencias"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {product.allow_negative_stock
                        ? "Permite saldo negativo"
                        : "No permite saldo negativo"}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top">
                    <span
                      className={[
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                        getInventoryProductStatusClass(product),
                      ].join(" ")}
                    >
                      {getInventoryProductStatusLabel(product)}
                    </span>
                  </td>

                  <td className="min-w-44 px-4 py-4 align-top">
                    <p className="text-sm text-slate-700">
                      {formatInventoryProductDateTime(
                        product.updated_at,
                        locale,
                      )}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-500">
          Mostrando {firstItem}–{lastItem} de {items.length}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1 || loading}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Anterior
          </button>

          <span className="min-w-24 text-center text-xs font-semibold text-slate-600">
            Página {safePage} de {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages || loading}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  );
}
