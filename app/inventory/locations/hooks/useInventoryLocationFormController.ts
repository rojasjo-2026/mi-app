"use client";

import { useCallback, useState } from "react";

import type {
  InventoryLocation,
  InventoryLocationDetail,
  InventoryLocationFormErrors,
  InventoryLocationFormMode,
  InventoryLocationFormState,
} from "../types";
import {
  buildInventoryLocationPayload,
  createEmptyInventoryLocationFormState,
  createInventoryLocationEditFormState,
  getFirstInventoryLocationFormError,
  validateInventoryLocationForm,
} from "../utils/inventoryLocationForm";

type InventoryLocationMutation = (
  input: Record<string, unknown>,
) => Promise<InventoryLocationDetail>;

type InventoryLocationUpdateMutation = (
  locationId: string,
  input: Record<string, unknown>,
) => Promise<InventoryLocationDetail>;

type UseInventoryLocationFormControllerParams = {
  countryCode?: string;
  createLocation: InventoryLocationMutation;
  updateLocation: InventoryLocationUpdateMutation;
  onSaved: (location: InventoryLocationDetail) => void | Promise<void>;
};

export function useInventoryLocationFormController({
  countryCode = "",
  createLocation,
  updateLocation,
  onSaved,
}: UseInventoryLocationFormControllerParams) {
  const [mode, setMode] = useState<InventoryLocationFormMode | null>(null);

  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );

  const [formState, setFormState] = useState<InventoryLocationFormState>(() =>
    createEmptyInventoryLocationFormState(countryCode),
  );

  const [errors, setErrors] = useState<InventoryLocationFormErrors>({});

  const [submitError, setSubmitError] = useState<string | null>(null);

  const closeForm = useCallback(() => {
    setMode(null);
    setEditingLocationId(null);
    setErrors({});
    setSubmitError(null);
  }, []);

  const openCreate = useCallback(
    (parentLocationId = "") => {
      setMode("create");
      setEditingLocationId(null);
      setFormState({
        ...createEmptyInventoryLocationFormState(countryCode),
        parentLocationId,
      });
      setErrors({});
      setSubmitError(null);
    },
    [countryCode],
  );

  const openEdit = useCallback((location: InventoryLocation) => {
    setMode("edit");
    setEditingLocationId(location.inventory_location_id);
    setFormState(createInventoryLocationEditFormState(location));
    setErrors({});
    setSubmitError(null);
  }, []);

  const setField = useCallback(
    <Field extends keyof InventoryLocationFormState>(
      field: Field,
      value: InventoryLocationFormState[Field],
    ) => {
      setFormState((current) => ({
        ...current,
        [field]: value,
      }));

      setErrors((current) => {
        if (!current[field]) {
          return current;
        }

        const nextErrors = {
          ...current,
        };

        delete nextErrors[field];

        return nextErrors;
      });

      setSubmitError(null);
    },
    [],
  );

  const submitForm = useCallback(async () => {
    if (!mode) {
      return null;
    }

    const validationErrors = validateInventoryLocationForm(formState);

    setErrors(validationErrors);

    const firstError = getFirstInventoryLocationFormError(validationErrors);

    if (firstError) {
      setSubmitError(firstError);
      return null;
    }

    try {
      const payload = buildInventoryLocationPayload(formState);

      const savedLocation =
        mode === "create"
          ? await createLocation(payload)
          : editingLocationId
            ? await updateLocation(editingLocationId, payload)
            : null;

      if (!savedLocation) {
        setSubmitError(
          "No fue posible identificar la ubicación que se está editando.",
        );
        return null;
      }

      await onSaved(savedLocation);
      closeForm();

      return savedLocation;
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error
          ? caughtError.message
          : "No fue posible guardar la ubicación.",
      );

      return null;
    }
  }, [
    closeForm,
    createLocation,
    editingLocationId,
    formState,
    mode,
    onSaved,
    updateLocation,
  ]);

  return {
    isOpen: mode !== null,
    mode,
    editingLocationId,
    formState,
    errors,
    submitError,
    openCreate,
    openEdit,
    closeForm,
    setField,
    submitForm,
  };
}
