"use client";

import { useEffect, useState } from "react";

import type {
  InventoryCategoryDetail,
  InventoryCategoryFormErrors,
  InventoryCategoryFormMode,
  InventoryCategoryFormState,
} from "../types";
import {
  buildInventoryCategoryCreatePayload,
  buildInventoryCategoryUpdatePayload,
  createInventoryCategoryFormFromDetail,
  DEFAULT_INVENTORY_CATEGORY_FORM,
  validateInventoryCategoryForm,
} from "../utils/inventoryCategoryForm";
import { useInventoryCategoryMutations } from "./useInventoryCategoryMutations";

type UseInventoryCategoryFormControllerInput = {
  onSaved: (category: InventoryCategoryDetail) => void;
};

function mapBackendFieldErrors(
  errors: Record<string, string>,
): InventoryCategoryFormErrors {
  const mapped: InventoryCategoryFormErrors = {};

  if (errors.category_code) {
    mapped.categoryCode = errors.category_code;
  }

  if (errors.name) {
    mapped.name = errors.name;
  }

  if (errors.description) {
    mapped.description = errors.description;
  }

  if (errors.parent_category_id) {
    mapped.parentCategoryId = errors.parent_category_id;
  }

  if (errors.sort_order) {
    mapped.sortOrder = errors.sort_order;
  }

  return mapped;
}

export function useInventoryCategoryFormController({
  onSaved,
}: UseInventoryCategoryFormControllerInput) {
  const [open, setOpen] = useState(false);

  const [mode, setMode] = useState<InventoryCategoryFormMode>("create");

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );

  const [form, setForm] = useState<InventoryCategoryFormState>({
    ...DEFAULT_INVENTORY_CATEGORY_FORM,
  });

  const [formErrors, setFormErrors] = useState<InventoryCategoryFormErrors>({});

  const {
    submitting,
    error,
    fieldErrors,
    clearMutationError,
    createCategory,
    updateCategory,
  } = useInventoryCategoryMutations();

  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) {
      return;
    }

    setFormErrors((current) => ({
      ...current,
      ...mapBackendFieldErrors(fieldErrors),
    }));
  }, [fieldErrors]);

  function openCreateForm(parentCategoryId = "") {
    clearMutationError();
    setFormErrors({});
    setEditingCategoryId(null);
    setMode("create");

    setForm({
      ...DEFAULT_INVENTORY_CATEGORY_FORM,
      parentCategoryId,
    });

    setOpen(true);
  }

  function openEditForm(category: InventoryCategoryDetail) {
    clearMutationError();
    setFormErrors({});
    setEditingCategoryId(category.inventory_category_id);
    setMode("edit");

    setForm(createInventoryCategoryFormFromDetail(category));

    setOpen(true);
  }

  function closeForm() {
    if (submitting) {
      return;
    }

    clearMutationError();
    setFormErrors({});
    setOpen(false);
    setEditingCategoryId(null);
  }

  function setField<TField extends keyof InventoryCategoryFormState>(
    field: TField,
    value: InventoryCategoryFormState[TField],
  ) {
    clearMutationError();

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

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
  }

  async function submitForm() {
    const validation = validateInventoryCategoryForm(
      form,
      editingCategoryId || undefined,
    );

    setForm(validation.normalized);
    setFormErrors(validation.errors);

    if (!validation.isValid) {
      return null;
    }

    const savedCategory =
      mode === "create"
        ? await createCategory(
            buildInventoryCategoryCreatePayload(validation.normalized),
          )
        : editingCategoryId
          ? await updateCategory(
              editingCategoryId,
              buildInventoryCategoryUpdatePayload(validation.normalized),
            )
          : null;

    if (!savedCategory) {
      return null;
    }

    setOpen(false);
    setEditingCategoryId(null);
    setFormErrors({});
    clearMutationError();

    onSaved(savedCategory);

    return savedCategory;
  }

  return {
    open,
    mode,
    editingCategoryId,
    form,
    formErrors,
    submitting,
    error,
    openCreateForm,
    openEditForm,
    closeForm,
    setField,
    submitForm,
  };
}
