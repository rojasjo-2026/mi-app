import type {
  InventoryCategoryDetail,
  InventoryCategoryFormErrors,
  InventoryCategoryFormState,
} from "../types";
import type {
  InventoryCategoryCreatePayload,
  InventoryCategoryUpdatePayload,
} from "../hooks/useInventoryCategoryMutations";

const MAX_CATEGORY_CODE_LENGTH = 40;
const MAX_CATEGORY_NAME_LENGTH = 120;
const MAX_CATEGORY_DESCRIPTION_LENGTH = 500;
const MAX_CATEGORY_SORT_ORDER = 1_000_000;

export const DEFAULT_INVENTORY_CATEGORY_FORM: InventoryCategoryFormState = {
  categoryCode: "",
  name: "",
  description: "",
  parentCategoryId: "",
  sortOrder: "0",
};

export function createInventoryCategoryFormFromDetail(
  detail: InventoryCategoryDetail,
): InventoryCategoryFormState {
  return {
    categoryCode: detail.category_code || "",
    name: detail.name,
    description: detail.description || "",
    parentCategoryId: detail.parent_category_id || "",
    sortOrder: String(detail.sort_order),
  };
}

export function normalizeInventoryCategoryForm(
  form: InventoryCategoryFormState,
): InventoryCategoryFormState {
  return {
    categoryCode: form.categoryCode.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description.trim(),
    parentCategoryId: form.parentCategoryId.trim(),
    sortOrder: form.sortOrder.trim(),
  };
}

export function validateInventoryCategoryForm(
  form: InventoryCategoryFormState,
  currentCategoryId?: string,
) {
  const normalized = normalizeInventoryCategoryForm(form);

  const errors: InventoryCategoryFormErrors = {};

  if (!normalized.name) {
    errors.name = "El nombre de la categoría es requerido.";
  } else if (normalized.name.length > MAX_CATEGORY_NAME_LENGTH) {
    errors.name = `El nombre no puede superar ${MAX_CATEGORY_NAME_LENGTH} caracteres.`;
  }

  if (normalized.categoryCode.length > MAX_CATEGORY_CODE_LENGTH) {
    errors.categoryCode = `El código no puede superar ${MAX_CATEGORY_CODE_LENGTH} caracteres.`;
  } else if (
    normalized.categoryCode &&
    !/^[A-Z0-9][A-Z0-9_-]*$/.test(normalized.categoryCode)
  ) {
    errors.categoryCode =
      "Usá únicamente letras, números, guiones y guiones bajos.";
  }

  if (normalized.description.length > MAX_CATEGORY_DESCRIPTION_LENGTH) {
    errors.description = `La descripción no puede superar ${MAX_CATEGORY_DESCRIPTION_LENGTH} caracteres.`;
  }

  if (currentCategoryId && normalized.parentCategoryId === currentCategoryId) {
    errors.parentCategoryId =
      "Una categoría no puede ser su propia categoría padre.";
  }

  const sortOrder = Number(normalized.sortOrder);

  if (!normalized.sortOrder) {
    errors.sortOrder = "El orden es requerido.";
  } else if (!Number.isInteger(sortOrder)) {
    errors.sortOrder = "El orden debe ser un número entero.";
  } else if (sortOrder < 0 || sortOrder > MAX_CATEGORY_SORT_ORDER) {
    errors.sortOrder = `El orden debe estar entre 0 y ${MAX_CATEGORY_SORT_ORDER}.`;
  }

  return {
    normalized,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function buildInventoryCategoryCreatePayload(
  form: InventoryCategoryFormState,
): InventoryCategoryCreatePayload {
  const normalized = normalizeInventoryCategoryForm(form);

  return {
    category_code: normalized.categoryCode || null,
    name: normalized.name,
    description: normalized.description || null,
    parent_category_id: normalized.parentCategoryId || null,
    sort_order: Number(normalized.sortOrder),
  };
}

export function buildInventoryCategoryUpdatePayload(
  form: InventoryCategoryFormState,
): InventoryCategoryUpdatePayload {
  return buildInventoryCategoryCreatePayload(form);
}
