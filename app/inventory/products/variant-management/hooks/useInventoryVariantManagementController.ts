"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { InventoryVariant } from "../../types";

import type {
  InventoryCodeFormState,
  InventoryVariantCodeSummary,
  InventoryVariantFormState,
  InventoryVariantFormMode,
  InventoryCodeFormMode,
} from "../types";

import {
  buildInventoryCodePayload,
  buildInventoryVariantPayload,
  createEmptyInventoryCodeFormState,
  createEmptyInventoryVariantFormState,
  createInventoryCodeEditFormState,
  createInventoryVariantEditFormState,
  validateInventoryCodeForm,
  validateInventoryVariantForm,
} from "../utils/inventoryVariantCodeForm";

import { useInventoryVariantCodeDetails } from "./useInventoryVariantCodeDetails";
import { useInventoryVariantCodeMutations } from "./useInventoryVariantCodeMutations";

type InventoryVariantManagementControllerParams = {
  productId: string | null;
  variants: InventoryVariant[];
  onChanged: () => void;
};

type InventoryCodeStatusTarget = {
  inventory_product_code_id: string;
  is_active: boolean;
};

export function useInventoryVariantManagementController({
  productId,
  variants,
  onChanged,
}: InventoryVariantManagementControllerParams) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );

  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);

  const [variantFormMode, setVariantFormMode] =
    useState<InventoryVariantFormMode | null>(null);

  const [codeFormMode, setCodeFormMode] =
    useState<InventoryCodeFormMode | null>(null);

  const [variantForm, setVariantForm] = useState<InventoryVariantFormState>(
    createEmptyInventoryVariantFormState,
  );

  const [codeForm, setCodeForm] = useState<InventoryCodeFormState>(
    createEmptyInventoryCodeFormState,
  );

  const [variantFormErrors, setVariantFormErrors] = useState<
    Partial<Record<keyof InventoryVariantFormState, string>>
  >({});

  const [codeFormErrors, setCodeFormErrors] = useState<
    Partial<Record<keyof InventoryCodeFormState, string>>
  >({});

  const [refreshKey, setRefreshKey] = useState(0);

  const [successMessage, setSuccessMessage] = useState("");

  const hydratedCodeIdRef = useRef<string | null>(null);

  const details = useInventoryVariantCodeDetails(
    selectedVariantId,
    selectedCodeId,
    refreshKey,
  );

  const mutations = useInventoryVariantCodeMutations();

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (variant) => variant.inventory_product_variant_id === selectedVariantId,
      ) || null,
    [selectedVariantId, variants],
  );

  const selectedCode = useMemo(
    () =>
      details.variantDetail?.codes.find(
        (code) => code.inventory_product_code_id === selectedCodeId,
      ) || null,
    [details.variantDetail, selectedCodeId],
  );

  useEffect(() => {
    setSelectedVariantId(null);
    setSelectedCodeId(null);

    setVariantFormMode(null);
    setCodeFormMode(null);

    setVariantForm(createEmptyInventoryVariantFormState());

    setCodeForm(createEmptyInventoryCodeFormState());

    setVariantFormErrors({});
    setCodeFormErrors({});

    setSuccessMessage("");
    mutations.clearError();

    hydratedCodeIdRef.current = null;
  }, [productId]);

  useEffect(() => {
    if (
      codeFormMode !== "edit" ||
      !selectedCodeId ||
      !details.codeDetail ||
      details.codeDetail.inventory_product_code_id !== selectedCodeId ||
      hydratedCodeIdRef.current === selectedCodeId
    ) {
      return;
    }

    setCodeForm(createInventoryCodeEditFormState(details.codeDetail));

    setCodeFormErrors({});
    hydratedCodeIdRef.current = selectedCodeId;
  }, [codeFormMode, details.codeDetail, selectedCodeId]);

  function clearMessages() {
    setSuccessMessage("");
    mutations.clearError();
  }

  function selectVariant(variantId: string | null) {
    clearMessages();

    setSelectedVariantId(variantId);
    setSelectedCodeId(null);

    setVariantFormMode(null);
    setCodeFormMode(null);

    setVariantFormErrors({});
    setCodeFormErrors({});

    hydratedCodeIdRef.current = null;
  }

  function openCreateVariant() {
    clearMessages();

    setSelectedVariantId(null);
    setSelectedCodeId(null);

    setVariantForm(createEmptyInventoryVariantFormState());

    setVariantFormErrors({});
    setVariantFormMode("create");

    setCodeFormMode(null);
    hydratedCodeIdRef.current = null;
  }

  function openEditVariant(variant: InventoryVariant) {
    clearMessages();

    setSelectedVariantId(variant.inventory_product_variant_id);

    setSelectedCodeId(null);

    setVariantForm(createInventoryVariantEditFormState(variant));

    setVariantFormErrors({});
    setVariantFormMode("edit");

    setCodeFormMode(null);
    hydratedCodeIdRef.current = null;
  }

  function closeVariantForm() {
    setVariantFormMode(null);
    setVariantFormErrors({});

    setVariantForm(createEmptyInventoryVariantFormState());

    mutations.clearError();
  }

  function openCreateCode(variantId: string) {
    clearMessages();

    setSelectedVariantId(variantId);
    setSelectedCodeId(null);

    setCodeForm(createEmptyInventoryCodeFormState());

    setCodeFormErrors({});
    setCodeFormMode("create");

    setVariantFormMode(null);
    hydratedCodeIdRef.current = null;
  }

  function openEditCode(variantId: string, codeId: string) {
    clearMessages();

    setSelectedVariantId(variantId);
    setSelectedCodeId(codeId);

    setCodeForm(createEmptyInventoryCodeFormState());

    setCodeFormErrors({});
    setCodeFormMode("edit");

    setVariantFormMode(null);
    hydratedCodeIdRef.current = null;
  }

  function closeCodeForm() {
    setCodeFormMode(null);
    setCodeFormErrors({});

    setCodeForm(createEmptyInventoryCodeFormState());

    mutations.clearError();
    hydratedCodeIdRef.current = null;
  }

  function changeVariantField<K extends keyof InventoryVariantFormState>(
    field: K,
    value: InventoryVariantFormState[K],
  ) {
    setVariantForm((current) => ({
      ...current,
      [field]: value,
    }));

    setVariantFormErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    mutations.clearError();
  }

  function changeCodeField<K extends keyof InventoryCodeFormState>(
    field: K,
    value: InventoryCodeFormState[K],
  ) {
    setCodeForm((current) => ({
      ...current,
      [field]: value,
    }));

    setCodeFormErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    mutations.clearError();
  }

  async function submitVariantForm() {
    if (!variantFormMode) {
      return false;
    }

    const validationErrors = validateInventoryVariantForm(variantForm);

    setVariantFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return false;
    }

    const existingVariant =
      details.variantDetail &&
      details.variantDetail.inventory_product_variant_id === selectedVariantId
        ? details.variantDetail
        : selectedVariant;

    const payload = buildInventoryVariantPayload(variantForm, existingVariant);

    mutations.clearError();
    setSuccessMessage("");

    try {
      const result =
        variantFormMode === "create"
          ? productId
            ? await mutations.createVariant(productId, payload)
            : null
          : selectedVariantId
            ? await mutations.updateVariant(selectedVariantId, payload)
            : null;

      if (!result) {
        return false;
      }

      setSelectedVariantId(result.data.inventory_product_variant_id);

      setVariantFormMode(null);
      setVariantFormErrors({});

      setSuccessMessage(result.message);

      setRefreshKey((current) => current + 1);

      onChanged();

      return true;
    } catch {
      return false;
    }
  }

  async function submitCodeForm() {
    if (!codeFormMode || !selectedVariantId) {
      return false;
    }

    const validationErrors = validateInventoryCodeForm(codeForm);

    setCodeFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return false;
    }

    const payload = buildInventoryCodePayload(codeForm);

    mutations.clearError();
    setSuccessMessage("");

    try {
      const result =
        codeFormMode === "create"
          ? await mutations.createCode(selectedVariantId, payload)
          : selectedCodeId
            ? await mutations.updateCode(selectedCodeId, payload)
            : null;

      if (!result) {
        return false;
      }

      setSelectedCodeId(result.data.inventory_product_code_id);

      setCodeFormMode(null);
      setCodeFormErrors({});

      setSuccessMessage(result.message);

      hydratedCodeIdRef.current = null;

      setRefreshKey((current) => current + 1);

      onChanged();

      return true;
    } catch {
      return false;
    }
  }

  async function changeVariantStatus(variant: InventoryVariant) {
    clearMessages();

    try {
      const result = variant.is_active
        ? await mutations.deactivateVariant(
            variant.inventory_product_variant_id,
          )
        : await mutations.reactivateVariant(
            variant.inventory_product_variant_id,
          );

      setSelectedVariantId(result.data.inventory_product_variant_id);

      setSuccessMessage(result.message);

      setRefreshKey((current) => current + 1);

      onChanged();

      return true;
    } catch {
      return false;
    }
  }

  async function changeCodeStatus(code: InventoryCodeStatusTarget) {
    clearMessages();

    try {
      const result = code.is_active
        ? await mutations.deactivateCode(code.inventory_product_code_id)
        : await mutations.reactivateCode(code.inventory_product_code_id);

      setSelectedCodeId(result.data.inventory_product_code_id);

      setSuccessMessage(result.message);

      hydratedCodeIdRef.current = null;

      setRefreshKey((current) => current + 1);

      onChanged();

      return true;
    } catch {
      return false;
    }
  }

  function refreshDetails() {
    setRefreshKey((current) => current + 1);
  }

  return {
    selectedVariantId,
    selectedCodeId,

    selectedVariant,
    selectedCode,

    variantFormMode,
    codeFormMode,

    variantForm,
    codeForm,

    variantFormErrors,
    codeFormErrors,

    variantDetail: details.variantDetail,
    variantLoading: details.variantLoading,
    variantError: details.variantError,

    codeDetail: details.codeDetail,
    codeLoading: details.codeLoading,
    codeError: details.codeError,

    mutationLoading: mutations.loading,
    activeMutation: mutations.activeAction,
    mutationError: mutations.error,

    successMessage,

    selectVariant,

    openCreateVariant,
    openEditVariant,
    closeVariantForm,

    openCreateCode,
    openEditCode,
    closeCodeForm,

    changeVariantField,
    changeCodeField,

    submitVariantForm,
    submitCodeForm,

    changeVariantStatus,
    changeCodeStatus,

    refreshDetails,
    clearMessages,
  };
}

export type InventoryVariantManagementController = ReturnType<
  typeof useInventoryVariantManagementController
>;

export type InventoryManagedCodeSummary = InventoryVariantCodeSummary;
