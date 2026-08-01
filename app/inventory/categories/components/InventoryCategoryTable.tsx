import { ChevronLeft, ChevronRight, FolderTree, Package } from "lucide-react";

import type { InventoryCategoryTreeItem } from "../utils/inventoryCategoryUi";
import {
  formatInventoryCategoryDateTime,
  getInventoryCategoryChildrenLabel,
  getInventoryCategoryCodeLabel,
  getInventoryCategoryProductsLabel,
  getInventoryCategoryStatusClass,
  getInventoryCategoryStatusLabel,
} from "../utils/inventoryCategoryUi";

type InventoryCategoryTableProps = {
  items: InventoryCategoryTreeItem[];
  selectedCategoryId: string | null;
  locale: string;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  loading: boolean;
  onSelect: (categoryId: string) => void;
  onPageChange: (page: number) => void;
};

export default function InventoryCategoryTable({
  items,
  selectedCategoryId,
  locale,
  page,
  pageSize,
  totalItems,
  totalPages,
  loading,
  onSelect,
  onPageChange,
}: InventoryCategoryTableProps) {
  const firstVisibleItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;

  const lastVisibleItem = Math.min(page * pageSize, totalItems);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Categoría
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Jerarquía
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Subcategorías
              </th>

              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                Productos
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
            {items.map((category) => {
              const isSelected =
                selectedCategoryId === category.inventory_category_id;

              return (
                <tr
                  key={category.inventory_category_id}
                  className={[
                    "transition",
                    isSelected ? "bg-blue-50/70" : "bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <td className="min-w-72 px-4 py-3.5 align-middle">
                    <button
                      type="button"
                      onClick={() => onSelect(category.inventory_category_id)}
                      className="flex w-full cursor-pointer items-center gap-3 text-left"
                    >
                      <span
                        aria-hidden="true"
                        className="shrink-0"
                        style={{
                          width: category.depth * 22,
                        }}
                      />

                      {category.depth > 0 ? (
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-slate-400"
                          aria-hidden="true"
                        />
                      ) : (
                        <FolderTree
                          className="h-4 w-4 shrink-0 text-blue-600"
                          aria-hidden="true"
                        />
                      )}

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-900">
                          {category.name}
                        </span>

                        <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                          {getInventoryCategoryCodeLabel(category)}
                        </span>
                      </span>
                    </button>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <div className="text-sm font-semibold text-slate-700">
                      {category.depth === 0
                        ? "Principal"
                        : `Nivel ${category.depth + 1}`}
                    </div>

                    <div className="mt-0.5 max-w-64 truncate text-xs text-slate-500">
                      {category.parent?.name || "Sin categoría padre"}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <div className="text-sm font-semibold text-slate-800">
                      {category.children_count}
                    </div>

                    <div className="mt-0.5 text-xs text-slate-500">
                      {getInventoryCategoryChildrenLabel(
                        category.children_count,
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex items-center gap-2">
                      <Package
                        className="h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />

                      <span className="text-sm font-semibold text-slate-800">
                        {category.products_count}
                      </span>
                    </div>

                    <div className="mt-0.5 text-xs text-slate-500">
                      {getInventoryCategoryProductsLabel(
                        category.products_count,
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle">
                    <span
                      className={[
                        "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                        getInventoryCategoryStatusClass(category),
                      ].join(" ")}
                    >
                      {getInventoryCategoryStatusLabel(category)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3.5 align-middle text-sm font-medium text-slate-600">
                    {formatInventoryCategoryDateTime(
                      category.updated_at,
                      locale,
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">
          Mostrando {firstVisibleItem}–{lastVisibleItem} de {totalItems}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            aria-label="Página anterior"
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <span className="min-w-24 text-center text-xs font-bold text-slate-600">
            Página {page} de {Math.max(totalPages, 1)}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            aria-label="Página siguiente"
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  );
}
