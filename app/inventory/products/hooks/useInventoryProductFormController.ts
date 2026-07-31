"use client";

import { useCallback, useState } from "react";

import type { InventoryProductDetail, InventoryVariant } from "../types";

import {
  buildCreateProductPayload,
  buildUpdateProductPayload,
  createProductFormFromDetail,
  DEFAULT_PRODUCT_FORM,
  hasProductFormErrors,
  normalizeProductFormRules,
  validateProductForm,
} from "../utils/inventoryProductForm";

import type {
  InventoryProductFormErrors,
  InventoryProductFormMode,
  InventoryProductFormState,
} from "../utils/inventoryProductForm";

import { useInventoryProductMutations } from "./useInventoryProductMutations";

type UseInventoryProductFormControllerInput = {
  onSaved: (product: InventoryProductDetail) => void;
};

export function useInventoryProductFormController({
  onSaved,
}: UseInventoryProductFormControllerInput) {
  const [open, setOpen] = useState(false);

  const [mode, setMode] = useState<InventoryProductFormMode>("create");

  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [form, setForm] =
    useState<InventoryProductFormState>(DEFAULT_PRODUCT_FORM);

  const [formErrors, setFormErrors] = useState<InventoryProductFormErrors>({});

  const {
    submitting,
    error: serverError,
    fieldErrors: serverFieldErrors,
    clearMutationError,
    createProduct,
    updateProduct,
  } = useInventoryProductMutations();

  const closeForm = useCallback(() => {
    if (submitting) {
      return;
    }

    setOpen(false);
    setEditingProductId(null);
    setFormErrors({});
    clearMutationError();
  }, [clearMutationError, submitting]);

  const openCreateForm = useCallback(() => {
    setMode("create");
    setEditingProductId(null);
    setForm(DEFAULT_PRODUCT_FORM);
    setFormErrors({});
    clearMutationError();
    setOpen(true);
  }, [clearMutationError]);

  const openEditForm = useCallback(
    (detail: InventoryProductDetail, variants: InventoryVariant[]) => {
      const defaultVariant =
        variants.find((variant) => variant.is_default) || variants[0] || null;

      setMode("edit");
      setEditingProductId(detail.inventory_product_id);

      setForm(createProductFormFromDetail(detail, defaultVariant));

      setFormErrors({});
      clearMutationError();
      setOpen(true);
    },
    [clearMutationError],
  );

  const changeField = useCallback(
    <K extends keyof InventoryProductFormState>(
      field: K,
      value: InventoryProductFormState[K],
    ) => {
      setForm((current) =>
        normalizeProductFormRules({
          ...current,
          [field]: value,
        }),
      );

      setFormErrors((current) => {
        if (!current[field]) {
          return current;
        }

        const next = {
          ...current,
        };

        delete next[field];

        return next;
      });

      clearMutationError();
    },
    [clearMutationError],
  );

  const submitForm = useCallback(async () => {
    const normalizedForm = normalizeProductFormRules(form);

    const validationErrors = validateProductForm(normalizedForm, mode);

    setForm(normalizedForm);
    setFormErrors(validationErrors);
    clearMutationError();

    if (hasProductFormErrors(validationErrors)) {
      return;
    }

    const savedProduct =
      mode === "create"
        ? await createProduct(buildCreateProductPayload(normalizedForm))
        : editingProductId
          ? await updateProduct(
              editingProductId,
              buildUpdateProductPayload(normalizedForm),
            )
          : null;

    if (!savedProduct) {
      return;
    }

    setOpen(false);
    setEditingProductId(null);
    setFormErrors({});
    onSaved(savedProduct);
  }, [
    clearMutationError,
    createProduct,
    editingProductId,
    form,
    mode,
    onSaved,
    updateProduct,
  ]);

  return {
    open,
    mode,
    form,
    formErrors,
    submitting,
    serverError,
    serverFieldErrors,
    openCreateForm,
    openEditForm,
    closeForm,
    changeField,
    submitForm,
  };
}
