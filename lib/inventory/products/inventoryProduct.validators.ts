import {
  InventoryProductType,
  InventoryTrackingMode,
  Prisma,
} from "@prisma/client";

import { InventoryValidationError } from "../shared/inventoryErrors";

import {
  normalizeCatalogDecimal,
  normalizeCatalogEnum,
  normalizeCatalogInputRecord,
  normalizeCatalogJsonObject,
  normalizeCatalogNullableUuid,
  normalizeCatalogOptionalBoolean,
  normalizeCatalogOptionalJsonObject,
  normalizeCatalogOptionalNullableUuid,
  normalizeCatalogOptionalText,
  normalizeCatalogRequiredText,
  normalizeCatalogSearch,
  normalizeCatalogUuid,
  requireCatalogUpdateFields,
} from "../shared/inventoryCatalogValidation";

import { normalizeInventoryVariantCreateInput } from "../variants/inventoryVariant.validators";

import type {
  InventoryProductCreateData,
  InventoryProductFilters,
  InventoryProductUpdateData,
} from "./inventoryProduct.types";

const MAX_NAME_LENGTH = 180;
const MAX_DESCRIPTION_LENGTH = 1_000;
const MAX_BRAND_LENGTH = 120;
const MAX_MODEL_LENGTH = 120;
const MAX_FILTER_LENGTH = 120;

const PRODUCT_TYPES = Object.values(InventoryProductType);
const TRACKING_MODES = Object.values(InventoryTrackingMode);

type ProductBusinessRulesInput = {
  managesStock: boolean;
  trackingMode: InventoryTrackingMode;
  allowNegativeStock: boolean;
  taxExempt: boolean;
  taxRate: string | null;
};

function normalizeFilterText(
  value: unknown,
  fieldLabel: string,
): string | undefined {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    return undefined;
  }

  if (cleanValue.length > MAX_FILTER_LENGTH) {
    throw new InventoryValidationError(
      `${fieldLabel} no puede superar ${MAX_FILTER_LENGTH} caracteres.`,
    );
  }

  return cleanValue;
}

function normalizeProductType(value: unknown): InventoryProductType {
  return normalizeCatalogEnum(value, "El tipo de producto", PRODUCT_TYPES);
}

function normalizeTrackingMode(value: unknown): InventoryTrackingMode {
  return normalizeCatalogEnum(value, "El modo de seguimiento", TRACKING_MODES);
}

function normalizeRequiredDefaultVariant(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new InventoryValidationError(
      "La variante predeterminada es requerida.",
      {
        errors: {
          default_variant:
            "Debe proporcionar la unidad y configuración inicial del producto.",
        },
      },
    );
  }

  const defaultVariant = normalizeInventoryVariantCreateInput(input);

  return {
    ...defaultVariant,
    is_default: true,
  };
}

export function validateInventoryProductBusinessRules(
  input: ProductBusinessRulesInput,
) {
  if (
    !input.managesStock &&
    input.trackingMode !== InventoryTrackingMode.NONE
  ) {
    throw new InventoryValidationError(
      "Un producto que no administra inventario no puede utilizar seguimiento por serie o lote.",
      {
        errors: {
          tracking_mode:
            "Seleccione NONE o habilite la administración de inventario.",
        },
      },
    );
  }

  if (!input.managesStock && input.allowNegativeStock) {
    throw new InventoryValidationError(
      "Un producto que no administra inventario no puede permitir existencias negativas.",
      {
        errors: {
          allow_negative_stock:
            "Habilite la administración de inventario o desactive esta opción.",
        },
      },
    );
  }

  if (
    input.taxExempt &&
    input.taxRate !== null &&
    !new Prisma.Decimal(input.taxRate).isZero()
  ) {
    throw new InventoryValidationError(
      "Un producto exento no puede tener una tasa de impuesto mayor que cero.",
      {
        errors: {
          tax_rate: "Elimine la tasa o cambie el producto a no exento.",
        },
      },
    );
  }
}

export function normalizeInventoryProductId(value: unknown) {
  return normalizeCatalogUuid(value, "El id del producto");
}

export function normalizeInventoryProductFilters(
  searchParams: URLSearchParams,
): InventoryProductFilters {
  const rawCategoryId = searchParams.get("category_id");

  const rawProductType = searchParams.get("product_type");

  const rawTrackingMode = searchParams.get("tracking_mode");

  return {
    search: normalizeCatalogSearch(searchParams.get("search")),
    activeOnly:
      normalizeCatalogOptionalBoolean(
        searchParams.get("active_only") ?? undefined,
        "El filtro activo",
      ) ?? true,
    categoryId: rawCategoryId
      ? normalizeCatalogUuid(rawCategoryId, "El id de la categoría")
      : undefined,
    productType: rawProductType
      ? normalizeProductType(rawProductType)
      : undefined,
    trackingMode: rawTrackingMode
      ? normalizeTrackingMode(rawTrackingMode)
      : undefined,
    managesStock: normalizeCatalogOptionalBoolean(
      searchParams.get("manages_stock") ?? undefined,
      "El filtro de administración de inventario",
    ),
    brand: normalizeFilterText(searchParams.get("brand"), "El filtro de marca"),
  };
}

export function normalizeInventoryProductCreateInput(
  input: unknown,
): InventoryProductCreateData {
  const record = normalizeCatalogInputRecord(input);

  const productType = normalizeProductType(record.product_type);

  const trackingMode =
    record.tracking_mode === undefined
      ? InventoryTrackingMode.NONE
      : normalizeTrackingMode(record.tracking_mode);

  const managesStock =
    normalizeCatalogOptionalBoolean(
      record.manages_stock,
      "El indicador de administración de inventario",
    ) ?? true;

  const hasExpiration =
    normalizeCatalogOptionalBoolean(
      record.has_expiration,
      "El indicador de vencimiento",
    ) ?? false;

  const allowNegativeStock =
    normalizeCatalogOptionalBoolean(
      record.allow_negative_stock,
      "El indicador de existencias negativas",
    ) ?? false;

  const taxExempt =
    normalizeCatalogOptionalBoolean(
      record.tax_exempt,
      "El indicador de exención fiscal",
    ) ?? false;

  const taxRate =
    normalizeCatalogDecimal(record.tax_rate, "La tasa de impuesto", {
      precision: 5,
      scale: 2,
      nullable: true,
      minimum: "0",
      maximum: "100",
    }) ?? null;

  validateInventoryProductBusinessRules({
    managesStock,
    trackingMode,
    allowNegativeStock,
    taxExempt,
    taxRate,
  });

  return {
    inventory_category_id: normalizeCatalogNullableUuid(
      record.inventory_category_id,
      "El id de la categoría",
    ),
    name: normalizeCatalogRequiredText(
      record.name,
      "El nombre del producto",
      MAX_NAME_LENGTH,
    ),
    description: normalizeCatalogOptionalText(
      record.description,
      "La descripción",
      MAX_DESCRIPTION_LENGTH,
    ),
    brand: normalizeCatalogOptionalText(
      record.brand,
      "La marca",
      MAX_BRAND_LENGTH,
    ),
    model: normalizeCatalogOptionalText(
      record.model,
      "El modelo",
      MAX_MODEL_LENGTH,
    ),
    product_type: productType,
    tracking_mode: trackingMode,
    manages_stock: managesStock,
    has_expiration: hasExpiration,
    allow_negative_stock: allowNegativeStock,
    tax_exempt: taxExempt,
    tax_rate: taxRate,
    attributes: normalizeCatalogJsonObject(
      record.attributes,
      "Los atributos del producto",
    ),
    default_variant: normalizeRequiredDefaultVariant(record.default_variant),
  };
}

export function normalizeInventoryProductUpdateInput(
  input: unknown,
): InventoryProductUpdateData {
  const record = normalizeCatalogInputRecord(input);
  const data: InventoryProductUpdateData = {};

  if (record.inventory_category_id !== undefined) {
    data.inventory_category_id = normalizeCatalogOptionalNullableUuid(
      record.inventory_category_id,
      "El id de la categoría",
    );
  }

  if (record.name !== undefined) {
    data.name = normalizeCatalogRequiredText(
      record.name,
      "El nombre del producto",
      MAX_NAME_LENGTH,
    );
  }

  if (record.description !== undefined) {
    data.description = normalizeCatalogOptionalText(
      record.description,
      "La descripción",
      MAX_DESCRIPTION_LENGTH,
    );
  }

  if (record.brand !== undefined) {
    data.brand = normalizeCatalogOptionalText(
      record.brand,
      "La marca",
      MAX_BRAND_LENGTH,
    );
  }

  if (record.model !== undefined) {
    data.model = normalizeCatalogOptionalText(
      record.model,
      "El modelo",
      MAX_MODEL_LENGTH,
    );
  }

  if (record.product_type !== undefined) {
    data.product_type = normalizeProductType(record.product_type);
  }

  if (record.tracking_mode !== undefined) {
    data.tracking_mode = normalizeTrackingMode(record.tracking_mode);
  }

  if (record.manages_stock !== undefined) {
    data.manages_stock = normalizeCatalogOptionalBoolean(
      record.manages_stock,
      "El indicador de administración de inventario",
    );
  }

  if (record.has_expiration !== undefined) {
    data.has_expiration = normalizeCatalogOptionalBoolean(
      record.has_expiration,
      "El indicador de vencimiento",
    );
  }

  if (record.allow_negative_stock !== undefined) {
    data.allow_negative_stock = normalizeCatalogOptionalBoolean(
      record.allow_negative_stock,
      "El indicador de existencias negativas",
    );
  }

  if (record.tax_exempt !== undefined) {
    data.tax_exempt = normalizeCatalogOptionalBoolean(
      record.tax_exempt,
      "El indicador de exención fiscal",
    );
  }

  if (record.tax_rate !== undefined) {
    data.tax_rate = normalizeCatalogDecimal(
      record.tax_rate,
      "La tasa de impuesto",
      {
        precision: 5,
        scale: 2,
        nullable: true,
        minimum: "0",
        maximum: "100",
      },
    );
  }

  if (record.attributes !== undefined) {
    data.attributes = normalizeCatalogOptionalJsonObject(
      record.attributes,
      "Los atributos del producto",
    );
  }

  if (record.is_active !== undefined) {
    data.is_active = normalizeCatalogOptionalBoolean(
      record.is_active,
      "El estado del producto",
    );
  }

  requireCatalogUpdateFields(data as Record<string, unknown>);

  return data;
}
