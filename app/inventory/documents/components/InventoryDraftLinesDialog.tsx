"use client";

import { PackagePlus, X } from "lucide-react";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import { createPortal } from "react-dom";

import type { InventoryApiResponse, InventoryDocumentDetail } from "../types";

import { formatInventoryDocumentMoney } from "../utils/inventoryDocumentUi";

import InventoryDraftLineForm from "./InventoryDraftLineForm";
import InventoryDraftLineList from "./InventoryDraftLineList";

import type {
  DeletedLineResponse,
  InventoryCatalogProduct,
  InventoryCatalogProductDetail,
  InventoryCatalogVariantDetail,
  InventoryDraftLine,
} from "./inventoryDraftLines.types";

import { getDecimalPlaces } from "./inventoryDraftLines.utils";

type InventoryDraftLinesDialogProps = {
  open: boolean;
  detail: InventoryDocumentDetail | null;
  locale: string;
  currency: string;
  onClose: () => void;
  onChanged: () => void;
};

export default function InventoryDraftLinesDialog({
  open,
  detail,
  locale,
  currency,
  onClose,
  onChanged,
}: InventoryDraftLinesDialogProps) {
  const [lines, setLines] = useState<InventoryDraftLine[]>([]);

  const [search, setSearch] = useState("");

  const [products, setProducts] = useState<InventoryCatalogProduct[]>([]);

  const [selectedProductId, setSelectedProductId] = useState("");

  const [productDetail, setProductDetail] =
    useState<InventoryCatalogProductDetail | null>(null);

  const [selectedVariantId, setSelectedVariantId] = useState("");

  const [variantDetail, setVariantDetail] =
    useState<InventoryCatalogVariantDetail | null>(null);

  const [quantity, setQuantity] = useState("1");

  const [unitCost, setUnitCost] = useState("0");

  const [notes, setNotes] = useState("");

  const [editingLine, setEditingLine] = useState<InventoryDraftLine | null>(
    null,
  );

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);

  const [loadingProducts, setLoadingProducts] = useState(false);

  const [loadingProductDetail, setLoadingProductDetail] = useState(false);

  const [loadingVariant, setLoadingVariant] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [operationError, setOperationError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const busy = submitting || deletingLineId !== null;

  const activeVariants = useMemo(
    () =>
      productDetail?.variants.filter(
        (variant) => variant.is_active && variant.stock_unit.is_active,
      ) ?? [],
    [productDetail],
  );

  const totalCost = useMemo(
    () => lines.reduce((total, line) => total + Number(line.total_cost), 0),
    [lines],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setLines(detail?.lines ?? []);
  }, [detail?.lines, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearch("");
    setProducts([]);
    setSelectedProductId("");
    setProductDetail(null);
    setSelectedVariantId("");
    setVariantDetail(null);
    setQuantity("1");
    setUnitCost("0");
    setNotes("");
    setEditingLine(null);
    setPendingDeleteId(null);
    setDeletingLineId(null);
    setFieldErrors({});
    setOperationError("");
    setSuccessMessage("");
  }, [detail?.inventory_document_id, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        setLoadingProducts(true);

        setOperationError("");

        const searchParams = new URLSearchParams({
          active_only: "true",

          manages_stock: "true",
        });

        const cleanSearch = search.trim();

        if (cleanSearch) {
          searchParams.set("search", cleanSearch);
        }

        const response = await fetch(
          `/api/inventory/products?${searchParams.toString()}`,
          {
            cache: "no-store",

            signal: controller.signal,
          },
        );

        const result: InventoryApiResponse<InventoryCatalogProduct[]> =
          await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message || "No se pudieron cargar los productos.",
          );
        }

        setProducts(result.data);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setOperationError(
          error instanceof Error
            ? error.message
            : "Ocurrió un error al buscar productos.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);

      controller.abort();
    };
  }, [open, search]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, onClose, open]);

  if (!open) {
    return null;
  }

  async function loadVariant(variantId: string) {
    if (!variantId) {
      setSelectedVariantId("");
      setVariantDetail(null);
      setUnitCost("0");

      return;
    }

    try {
      setLoadingVariant(true);

      setOperationError("");

      setSelectedVariantId(variantId);

      setVariantDetail(null);

      const response = await fetch(
        `/api/inventory/variants/${encodeURIComponent(variantId)}`,
        {
          cache: "no-store",
        },
      );

      const result: InventoryApiResponse<InventoryCatalogVariantDetail> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "No se pudo cargar la variante.");
      }

      setVariantDetail(result.data);

      setUnitCost(result.data.default_cost ?? "0");
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar la variante.",
      );
    } finally {
      setLoadingVariant(false);
    }
  }

  async function loadProduct(productId: string) {
    setSelectedProductId(productId);

    setProductDetail(null);
    setSelectedVariantId("");
    setVariantDetail(null);
    setUnitCost("0");
    setFieldErrors({});
    setSuccessMessage("");

    if (!productId) {
      return;
    }

    try {
      setLoadingProductDetail(true);

      setOperationError("");

      const response = await fetch(
        `/api/inventory/products/${encodeURIComponent(productId)}`,
        {
          cache: "no-store",
        },
      );

      const result: InventoryApiResponse<InventoryCatalogProductDetail> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "No se pudo cargar el producto.");
      }

      setProductDetail(result.data);

      const variants = result.data.variants.filter(
        (variant) => variant.is_active && variant.stock_unit.is_active,
      );

      const initialVariant =
        variants.find((variant) => variant.is_default) ?? variants[0] ?? null;

      if (!initialVariant) {
        throw new Error("El producto no tiene variantes activas disponibles.");
      }

      await loadVariant(initialVariant.inventory_product_variant_id);
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar el producto.",
      );
    } finally {
      setLoadingProductDetail(false);
    }
  }

  function resetForm() {
    setQuantity("1");
    setNotes("");
    setEditingLine(null);
    setFieldErrors({});
    setOperationError("");
    setSuccessMessage("");
  }

  function startEditing(line: InventoryDraftLine) {
    setEditingLine(line);

    setQuantity(line.quantity);

    setUnitCost(line.unit_cost);

    setNotes(line.notes ?? "");

    setPendingDeleteId(null);

    setFieldErrors({});
    setOperationError("");
    setSuccessMessage("");
  }

  function validateForm() {
    const errors: Record<string, string> = {};

    const parsedQuantity = Number(quantity);

    const parsedUnitCost = Number(unitCost);

    const unit = editingLine
      ? editingLine.unit_of_measure
      : variantDetail?.stock_unit;

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      errors.quantity = "La cantidad debe ser mayor que cero.";
    } else if (
      unit &&
      !unit.allows_decimal &&
      !Number.isInteger(parsedQuantity)
    ) {
      errors.quantity = `La unidad ${unit.code} solo permite cantidades enteras.`;
    } else if (unit && getDecimalPlaces(quantity) > unit.decimal_scale) {
      errors.quantity = `La unidad ${unit.code} permite hasta ${unit.decimal_scale} decimales.`;
    }

    if (!Number.isFinite(parsedUnitCost) || parsedUnitCost < 0) {
      errors.unit_cost = "El costo no puede ser negativo.";
    } else if (getDecimalPlaces(unitCost) > 4) {
      errors.unit_cost = "El costo permite hasta 4 decimales.";
    }

    if (!editingLine && !selectedProductId) {
      errors.inventory_product_id = "Selecciona un producto.";
    }

    if (!editingLine && !variantDetail) {
      errors.inventory_product_variant_id = "Selecciona una variante.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setOperationError("");
    setSuccessMessage("");

    if (!detail || !validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const cleanNotes = notes.trim();

      const response = editingLine
        ? await fetch(
            `/api/inventory/document-lines/${encodeURIComponent(
              editingLine.inventory_document_line_id,
            )}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                quantity,

                unit_cost: unitCost,

                notes: cleanNotes || null,
              }),
            },
          )
        : await fetch(
            `/api/inventory/documents/${encodeURIComponent(
              detail.inventory_document_id,
            )}/lines`,
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                inventory_product_variant_id:
                  variantDetail?.inventory_product_variant_id,

                inventory_product_code_id: null,

                unit_of_measure_id:
                  variantDetail?.stock_unit.unit_of_measure_id,

                quantity,

                conversion_factor: "1",

                unit_cost: unitCost,

                notes: cleanNotes || null,
              }),
            },
          );

      const result: InventoryApiResponse<InventoryDraftLine> =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        setFieldErrors(result.errors ?? {});

        throw new Error(result.message || "No se pudo guardar el producto.");
      }

      const savedLine = result.data;

      if (editingLine) {
        setLines((current) =>
          current.map((line) =>
            line.inventory_document_line_id ===
            savedLine.inventory_document_line_id
              ? savedLine
              : line,
          ),
        );

        setSuccessMessage("Producto actualizado correctamente.");
      } else {
        setLines((current) =>
          [...current, savedLine].sort(
            (left, right) => left.line_number - right.line_number,
          ),
        );

        setSuccessMessage("Producto agregado al borrador.");
      }

      setQuantity("1");
      setNotes("");
      setEditingLine(null);
      setFieldErrors({});

      onChanged();
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar el producto.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(line: InventoryDraftLine) {
    const lineId = line.inventory_document_line_id;

    if (pendingDeleteId !== lineId) {
      setPendingDeleteId(lineId);

      setOperationError("");
      setSuccessMessage("");

      return;
    }

    try {
      setDeletingLineId(lineId);

      setOperationError("");

      const response = await fetch(
        `/api/inventory/document-lines/${encodeURIComponent(lineId)}`,
        {
          method: "DELETE",
        },
      );

      const result: InventoryApiResponse<DeletedLineResponse> =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo quitar el producto.");
      }

      setLines((current) =>
        current.filter(
          (currentLine) => currentLine.inventory_document_line_id !== lineId,
        ),
      );

      if (editingLine?.inventory_document_line_id === lineId) {
        resetForm();
      }

      setPendingDeleteId(null);

      setSuccessMessage("Producto quitado del borrador.");

      onChanged();
    } catch (error) {
      setOperationError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al quitar el producto.",
      );
    } finally {
      setDeletingLineId(null);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-5">
      <button
        type="button"
        aria-label="Cerrar productos del borrador"
        disabled={busy}
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-slate-950/10 disabled:cursor-not-allowed"
      />

      <section className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100vh-2.5rem)]">
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <PackagePlus className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Borrador de inventario
            </p>

            <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">
              Productos de {detail?.document_number ?? "la operación"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Agrega, modifica o quita productos antes de procesar la operación.
            </p>
          </div>

          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-xs font-medium text-slate-400">
              Total del borrador
            </p>

            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">
              {formatInventoryDocumentMoney(
                String(totalCost),
                locale,
                currency,
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(320px,0.82fr)_minmax(420px,1.18fr)]">
          <InventoryDraftLineForm
            editingLine={editingLine}
            operationError={operationError}
            successMessage={successMessage}
            search={search}
            products={products}
            selectedProductId={selectedProductId}
            productDetail={productDetail}
            selectedVariantId={selectedVariantId}
            activeVariants={activeVariants}
            variantDetail={variantDetail}
            quantity={quantity}
            unitCost={unitCost}
            notes={notes}
            loadingProducts={loadingProducts}
            loadingProductDetail={loadingProductDetail}
            loadingVariant={loadingVariant}
            submitting={submitting}
            busy={busy}
            fieldErrors={fieldErrors}
            onSubmit={handleSubmit}
            onSearchChange={setSearch}
            onProductChange={loadProduct}
            onVariantChange={loadVariant}
            onQuantityChange={setQuantity}
            onUnitCostChange={setUnitCost}
            onNotesChange={setNotes}
            onCancelEditing={resetForm}
          />

          <InventoryDraftLineList
            lines={lines}
            locale={locale}
            currency={currency}
            editingLine={editingLine}
            pendingDeleteId={pendingDeleteId}
            deletingLineId={deletingLineId}
            busy={busy}
            onStartEditing={startEditing}
            onCancelDelete={() => setPendingDeleteId(null)}
            onDelete={handleDelete}
          />
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
          <p className="hidden text-xs text-slate-500 sm:block">
            Los cambios actualizan automáticamente el total del borrador.
          </p>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="ml-auto inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cerrar
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
