import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findInventoryProductById: vi.fn(),

  findInventoryVariantById: vi.fn(),
  findInventoryVariantStockUnitById: vi.fn(),
  normalizeInventoryVariantId: vi.fn(),

  mapInventoryCode: vi.fn(),
  mapInventoryCodes: vi.fn(),

  createInventoryCodeRecord: vi.fn(),
  deactivateInventoryCodeRecord: vi.fn(),
  findActivePrimaryInventoryCode: vi.fn(),
  findAnotherActiveInventoryCode: vi.fn(),
  findInventoryCodeById: vi.fn(),
  findInventoryCodeByValue: vi.fn(),
  findInventoryCodeDetailById: vi.fn(),
  findInventoryCodes: vi.fn(),
  findInventoryCodeUnitById: vi.fn(),
  updateInventoryCodeRecord: vi.fn(),

  normalizeInventoryCodeCreateInput: vi.fn(),
  normalizeInventoryCodeFilters: vi.fn(),
  normalizeInventoryCodeId: vi.fn(),
  normalizeInventoryCodeUpdateInput: vi.fn(),
}));

vi.mock("../../../lib/inventory/products/inventoryProduct.repository", () => ({
  findInventoryProductById: mocks.findInventoryProductById,
}));

vi.mock("../../../lib/inventory/variants/inventoryVariant.repository", () => ({
  findInventoryVariantById: mocks.findInventoryVariantById,
  findInventoryVariantStockUnitById: mocks.findInventoryVariantStockUnitById,
}));

vi.mock("../../../lib/inventory/variants/inventoryVariant.validators", () => ({
  normalizeInventoryVariantId: mocks.normalizeInventoryVariantId,
}));

vi.mock("../../../lib/inventory/codes/inventoryCode.mapper", () => ({
  mapInventoryCode: mocks.mapInventoryCode,
  mapInventoryCodes: mocks.mapInventoryCodes,
}));

vi.mock("../../../lib/inventory/codes/inventoryCode.repository", () => ({
  createInventoryCodeRecord: mocks.createInventoryCodeRecord,
  deactivateInventoryCodeRecord: mocks.deactivateInventoryCodeRecord,
  findActivePrimaryInventoryCode: mocks.findActivePrimaryInventoryCode,
  findAnotherActiveInventoryCode: mocks.findAnotherActiveInventoryCode,
  findInventoryCodeById: mocks.findInventoryCodeById,
  findInventoryCodeByValue: mocks.findInventoryCodeByValue,
  findInventoryCodeDetailById: mocks.findInventoryCodeDetailById,
  findInventoryCodes: mocks.findInventoryCodes,
  findInventoryCodeUnitById: mocks.findInventoryCodeUnitById,
  updateInventoryCodeRecord: mocks.updateInventoryCodeRecord,
}));

vi.mock("../../../lib/inventory/codes/inventoryCode.validators", () => ({
  normalizeInventoryCodeCreateInput: mocks.normalizeInventoryCodeCreateInput,
  normalizeInventoryCodeFilters: mocks.normalizeInventoryCodeFilters,
  normalizeInventoryCodeId: mocks.normalizeInventoryCodeId,
  normalizeInventoryCodeUpdateInput: mocks.normalizeInventoryCodeUpdateInput,
}));

import {
  createInventoryCode,
  deactivateInventoryCode,
  updateInventoryCode,
} from "../../../lib/inventory/codes/inventoryCode.service";

type RecordOverrides = Record<string, unknown>;

function makeCodeRecord(overrides: RecordOverrides = {}) {
  return {
    inventory_product_code_id: "code-1",
    inventory_product_variant_id: "variant-1",
    unit_of_measure_id: null,
    code: "SKU-TEST-001",
    code_type: "SKU",
    label: "Código de prueba",
    quantity_in_stock_unit: {
      toString: () => "1",
    },
    is_primary: false,
    is_scannable: true,
    is_active: true,
    created_at: new Date("2026-08-01T12:00:00.000Z"),
    updated_at: new Date("2026-08-01T12:00:00.000Z"),
    ...overrides,
  };
}

function makeCodeDetail(overrides: RecordOverrides = {}) {
  return {
    inventory_product_code_id: "code-1",
    inventory_product_variant_id: "variant-1",
    unit_of_measure_id: null,
    code: "SKU-TEST-001",
    code_type: "SKU",
    label: "Código de prueba",
    quantity_in_stock_unit: "1",
    is_primary: false,
    is_scannable: true,
    is_active: true,
    unit_of_measure: null,
    created_at: "2026-08-01T12:00:00.000Z",
    updated_at: "2026-08-01T12:00:00.000Z",
    ...overrides,
  };
}

const baseCreateInput = {
  unit_of_measure_id: null,
  code: "SKU-TEST-001",
  code_type: "SKU",
  label: "Código de prueba",
  quantity_in_stock_unit: "1",
  is_primary: false,
  is_scannable: true,
};

describe("inventoryCode.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.normalizeInventoryVariantId.mockImplementation((value: unknown) =>
      String(value),
    );

    mocks.normalizeInventoryCodeId.mockImplementation((value: unknown) =>
      String(value),
    );

    mocks.normalizeInventoryCodeCreateInput.mockImplementation(
      (value: unknown) => ({
        ...(value as Record<string, unknown>),
      }),
    );

    mocks.normalizeInventoryCodeUpdateInput.mockImplementation(
      (value: unknown) => ({
        ...(value as Record<string, unknown>),
      }),
    );

    mocks.findInventoryVariantById.mockResolvedValue({
      inventory_product_variant_id: "variant-1",
      inventory_product_id: "product-1",
      stock_unit_id: "unit-1",
      is_active: true,
    });

    mocks.findInventoryProductById.mockResolvedValue({
      inventory_product_id: "product-1",
      is_active: true,
    });

    mocks.findInventoryVariantStockUnitById.mockResolvedValue({
      unit_of_measure_id: "unit-1",
      allows_decimal: true,
      decimal_scale: 4,
      is_active: true,
    });

    mocks.findInventoryCodeUnitById.mockResolvedValue({
      unit_of_measure_id: "unit-1",
      allows_decimal: true,
      decimal_scale: 4,
      is_active: true,
    });

    mocks.findInventoryCodeByValue.mockResolvedValue(null);

    mocks.findActivePrimaryInventoryCode.mockResolvedValue(
      makeCodeRecord({
        inventory_product_code_id: "primary-1",
        is_primary: true,
      }),
    );

    mocks.findAnotherActiveInventoryCode.mockResolvedValue(null);

    mocks.mapInventoryCode.mockImplementation((value: unknown) => value);

    mocks.mapInventoryCodes.mockImplementation((value: unknown) => value);

    mocks.createInventoryCodeRecord.mockResolvedValue(makeCodeRecord());

    mocks.updateInventoryCodeRecord.mockResolvedValue(makeCodeRecord());

    mocks.deactivateInventoryCodeRecord.mockResolvedValue(
      makeCodeRecord({
        is_active: false,
        is_primary: false,
      }),
    );

    mocks.findInventoryCodeDetailById.mockResolvedValue(makeCodeDetail());
  });

  it("rechaza un código duplicado en todo el inventario", async () => {
    mocks.findInventoryCodeByValue.mockResolvedValue(
      makeCodeRecord({
        inventory_product_code_id: "existing-code",
        code: "SKU-TEST-001",
      }),
    );

    const result = await createInventoryCode("variant-1", baseCreateInput);

    expect(result.status).toBe(409);
    expect(result.body).toMatchObject({
      success: false,
      message: "Ya existe un código de inventario con ese valor.",
      errors: {
        code: "Ingrese un código diferente.",
      },
    });

    expect(mocks.createInventoryCodeRecord).not.toHaveBeenCalled();
  });

  it("impide quitar directamente la condición de código principal", async () => {
    mocks.findInventoryCodeById.mockResolvedValue(
      makeCodeRecord({
        is_primary: true,
        is_active: true,
      }),
    );

    const result = await updateInventoryCode("code-1", {
      is_primary: false,
    });

    expect(result.status).toBe(409);
    expect(result.body).toMatchObject({
      success: false,
      message: "No puede quitar directamente la condición de código principal.",
      errors: {
        is_primary:
          "Marque otro código como principal para realizar el cambio.",
      },
    });

    expect(mocks.updateInventoryCodeRecord).not.toHaveBeenCalled();
    expect(mocks.deactivateInventoryCodeRecord).not.toHaveBeenCalled();
  });

  it("envía el cambio de principal al repositorio para la misma presentación", async () => {
    mocks.findInventoryCodeById.mockResolvedValue(
      makeCodeRecord({
        inventory_product_code_id: "code-2",
        inventory_product_variant_id: "variant-1",
        is_primary: false,
      }),
    );

    mocks.findInventoryCodeDetailById.mockResolvedValue(
      makeCodeDetail({
        inventory_product_code_id: "code-2",
        inventory_product_variant_id: "variant-1",
        is_primary: true,
      }),
    );

    const result = await updateInventoryCode("code-2", {
      is_primary: true,
    });

    expect(result.status).toBe(200);

    expect(mocks.updateInventoryCodeRecord).toHaveBeenCalledWith(
      "code-2",
      "variant-1",
      expect.objectContaining({
        is_primary: true,
      }),
    );

    expect(result.body.data).toMatchObject({
      inventory_product_code_id: "code-2",
      inventory_product_variant_id: "variant-1",
      is_primary: true,
    });
  });

  it("desactiva un código y conserva su presentación", async () => {
    mocks.findInventoryCodeById.mockResolvedValue(
      makeCodeRecord({
        inventory_product_code_id: "code-3",
        inventory_product_variant_id: "variant-1",
        is_primary: false,
        is_active: true,
      }),
    );

    mocks.findInventoryCodeDetailById.mockResolvedValue(
      makeCodeDetail({
        inventory_product_code_id: "code-3",
        inventory_product_variant_id: "variant-1",
        is_active: false,
        is_primary: false,
      }),
    );

    const result = await deactivateInventoryCode("code-3");

    expect(result.status).toBe(200);

    expect(mocks.deactivateInventoryCodeRecord).toHaveBeenCalledWith(
      "code-3",
      "variant-1",
      {},
      null,
    );

    expect(result.body.data).toMatchObject({
      inventory_product_code_id: "code-3",
      inventory_product_variant_id: "variant-1",
      is_active: false,
    });
  });

  it("reactiva un código y lo convierte en principal cuando no existe otro", async () => {
    mocks.findInventoryCodeById.mockResolvedValue(
      makeCodeRecord({
        inventory_product_code_id: "code-4",
        inventory_product_variant_id: "variant-1",
        is_primary: false,
        is_active: false,
      }),
    );

    mocks.findActivePrimaryInventoryCode.mockResolvedValue(null);

    mocks.findInventoryCodeDetailById.mockResolvedValue(
      makeCodeDetail({
        inventory_product_code_id: "code-4",
        inventory_product_variant_id: "variant-1",
        is_primary: true,
        is_active: true,
      }),
    );

    const result = await updateInventoryCode("code-4", {
      is_active: true,
    });

    expect(result.status).toBe(200);

    expect(mocks.updateInventoryCodeRecord).toHaveBeenCalledWith(
      "code-4",
      "variant-1",
      expect.objectContaining({
        is_active: true,
        is_primary: true,
      }),
    );

    expect(result.body.data).toMatchObject({
      inventory_product_code_id: "code-4",
      inventory_product_variant_id: "variant-1",
      is_primary: true,
      is_active: true,
    });
  });

  it("crea el código dentro de la presentación recibida", async () => {
    mocks.findInventoryVariantById.mockResolvedValue({
      inventory_product_variant_id: "variant-2",
      inventory_product_id: "product-1",
      stock_unit_id: "unit-1",
      is_active: true,
    });

    mocks.findActivePrimaryInventoryCode.mockResolvedValue(null);

    mocks.createInventoryCodeRecord.mockResolvedValue(
      makeCodeRecord({
        inventory_product_code_id: "created-code",
        inventory_product_variant_id: "variant-2",
        code: "SKU-VARIANT-2",
        is_primary: true,
      }),
    );

    mocks.findInventoryCodeDetailById.mockResolvedValue(
      makeCodeDetail({
        inventory_product_code_id: "created-code",
        inventory_product_variant_id: "variant-2",
        code: "SKU-VARIANT-2",
        is_primary: true,
      }),
    );

    const result = await createInventoryCode("variant-2", {
      ...baseCreateInput,
      code: "SKU-VARIANT-2",
    });

    expect(result.status).toBe(201);

    expect(mocks.createInventoryCodeRecord).toHaveBeenCalledWith(
      "variant-2",
      expect.objectContaining({
        code: "SKU-VARIANT-2",
        is_primary: true,
      }),
    );

    expect(result.body.data).toMatchObject({
      inventory_product_code_id: "created-code",
      inventory_product_variant_id: "variant-2",
      code: "SKU-VARIANT-2",
      is_primary: true,
    });
  });
});

describe("inventoryCode.repository contract", () => {
  const repositorySource = readFileSync(
    resolve(process.cwd(), "lib/inventory/codes/inventoryCode.repository.ts"),
    "utf8",
  );

  it("reemplaza el principal solo dentro de la misma presentación", () => {
    const start = repositorySource.indexOf(
      "export function updateInventoryCodeRecord",
    );

    const end = repositorySource.indexOf(
      "export function deactivateInventoryCodeRecord",
    );

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const updateFunction = repositorySource.slice(start, end);

    expect(updateFunction).toContain(
      "inventory_product_variant_id: inventoryProductVariantId",
    );

    expect(updateFunction).toContain("not: inventoryProductCodeId");

    expect(updateFunction).toContain("is_primary: false");
    expect(updateFunction).toContain("is_primary === true");
  });

  it("desactiva el código y puede asignar un principal sustituto", () => {
    const start = repositorySource.indexOf(
      "export function deactivateInventoryCodeRecord",
    );

    const end = repositorySource.indexOf(
      "export function findActivePrimaryInventoryCode",
    );

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const deactivateFunction = repositorySource.slice(start, end);

    expect(deactivateFunction).toContain("is_active: false");
    expect(deactivateFunction).toContain("is_primary: false");
    expect(deactivateFunction).toContain("replacementPrimaryCodeId");

    expect(deactivateFunction).toContain(
      "inventory_product_variant_id: inventoryProductVariantId",
    );
  });
});
