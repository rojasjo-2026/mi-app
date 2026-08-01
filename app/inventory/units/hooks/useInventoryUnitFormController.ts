"use client";

import { useEffect, useState } from "react";

import type {
  InventoryUnitFormErrors,
  InventoryUnitFormMode,
  InventoryUnitFormState,
  InventoryUnitOfMeasure,
} from "../types";
import {
  buildInventoryUnitCreatePayload,
  buildInventoryUnitUpdatePayload,
  createInventoryUnitFormFromDetail,
  DEFAULT_INVENTORY_UNIT_FORM,
  validateInventoryUnitForm,
} from "../utils/inventoryUnitForm";
import { useInventoryUnitMutations } from "./useInventoryUnitMutations";

type UseInventoryUnitFormControllerInput = {
  onSaved: (unit: InventoryUnitOfMeasure) => void;
};

function mapBackendFieldErrors(
  errors: Record<string, string>,
): InventoryUnitFormErrors {
  const mapped: InventoryUnitFormErrors = {};

  if (errors.code) {
    mapped.code = errors.code;
  }

  if (errors.name) {
    mapped.name = errors.name;
  }

  if (errors.symbol) {
    mapped.symbol = errors.symbol;
  }

  if (errors.allows_decimal) {
    mapped.allowsDecimal = errors.allows_decimal;
  }

  if (errors.decimal_scale) {
    mapped.decimalScale = errors.decimal_scale;
  }

  return mapped;
}

export function useInventoryUnitFormController({
  onSaved,
}: UseInventoryUnitFormControllerInput) {
  const [open, setOpen] = useState(false);

  const [mode, setMode] = useState<InventoryUnitFormMode>("create");

  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  const [form, setForm] = useState<InventoryUnitFormState>({
    ...DEFAULT_INVENTORY_UNIT_FORM,
  });

  const [formErrors, setFormErrors] = useState<InventoryUnitFormErrors>({});

  const {
    submitting,
    error,
    fieldErrors,
    clearMutationError,
    createUnit,
    updateUnit,
  } = useInventoryUnitMutations();

  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) {
      return;
    }

    setFormErrors((current) => ({
      ...current,
      ...mapBackendFieldErrors(fieldErrors),
    }));
  }, [fieldErrors]);

  function openCreateForm() {
    clearMutationError();
    setFormErrors({});
    setEditingUnitId(null);
    setMode("create");

    setForm({
      ...DEFAULT_INVENTORY_UNIT_FORM,
    });

    setOpen(true);
  }

  function openEditForm(unit: InventoryUnitOfMeasure) {
    clearMutationError();
    setFormErrors({});
    setEditingUnitId(unit.unit_of_measure_id);
    setMode("edit");

    setForm(createInventoryUnitFormFromDetail(unit));

    setOpen(true);
  }

  function closeForm() {
    if (submitting) {
      return;
    }

    clearMutationError();
    setFormErrors({});
    setEditingUnitId(null);
    setOpen(false);
  }

  function setField<TField extends keyof InventoryUnitFormState>(
    field: TField,
    value: InventoryUnitFormState[TField],
  ) {
    clearMutationError();

    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (field === "allowsDecimal" && value === false) {
        next.decimalScale = "0";
      }

      return next;
    });

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
    const validation = validateInventoryUnitForm(form);

    setForm(validation.normalized);
    setFormErrors(validation.errors);

    if (!validation.isValid) {
      return null;
    }

    const savedUnit =
      mode === "create"
        ? await createUnit(
            buildInventoryUnitCreatePayload(validation.normalized),
          )
        : editingUnitId
          ? await updateUnit(
              editingUnitId,
              buildInventoryUnitUpdatePayload(validation.normalized),
            )
          : null;

    if (!savedUnit) {
      return null;
    }

    setOpen(false);
    setEditingUnitId(null);
    setFormErrors({});
    clearMutationError();

    onSaved(savedUnit);

    return savedUnit;
  }

  return {
    open,
    mode,
    editingUnitId,
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
