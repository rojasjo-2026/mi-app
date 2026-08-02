import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const panelSource = readSource(
  "app/inventory/products/variant-management/components/InventoryVariantManagementPanel.tsx",
);

const previewSource = readSource(
  "app/inventory/products/components/InventoryProductPreviewPanel.tsx",
);

const variantFormSource = readSource(
  "app/inventory/products/variant-management/components/InventoryVariantFormPanel.tsx",
);

const codeFormSource = readSource(
  "app/inventory/products/variant-management/components/InventoryCodeFormPanel.tsx",
);

const utilsSource = readSource(
  "app/inventory/products/variant-management/utils/inventoryVariantCodeForm.ts",
);

describe("InventoryVariantManagementPanel contract", () => {
  it("conserva estados de carga y error", () => {
    expect(panelSource).toContain("variantsLoading: boolean");
    expect(panelSource).toContain("variantsError: string");
    expect(panelSource).toContain("Cargando presentaciones…");
    expect(panelSource).toContain(
      "toInventoryPresentationLanguage(variantsError)",
    );
  });

  it("recibe configuración desde el preview", () => {
    expect(previewSource).toContain("variantsLoading={variantsLoading}");

    expect(previewSource).toContain("variantsError={variantsError}");

    expect(previewSource).toContain("locale={locale}");
    expect(previewSource).toContain("currency={currency}");
  });

  it("formatea moneda y cantidades", () => {
    expect(panelSource).toContain("formatInventoryProductMoney");

    expect(panelSource).toContain("formatInventoryProductQuantity");

    expect(panelSource).not.toContain(
      '{variant.default_price ?? "Sin precio"}',
    );

    expect(panelSource).not.toContain(
      'value={variant.default_cost ?? "Sin costo"}',
    );
  });

  it("no conserva terminología visible de variante", () => {
    const forbiddenText = [
      ">Variantes<",
      "No hay variantes configuradas",
      "Crear variante",
      "otra variante como",
      "Cargando variante…",
    ];

    for (const text of forbiddenText) {
      expect(panelSource).not.toContain(text);
      expect(variantFormSource).not.toContain(text);
    }
  });

  it("mantiene una sola declaración del traductor", () => {
    const functionMatches =
      utilsSource.match(/export function toInventoryPresentationLanguage/g) ||
      [];

    const variantImportMatches =
      variantFormSource.match(
        /import \{ toInventoryPresentationLanguage \}/g,
      ) || [];

    const codeImportMatches =
      codeFormSource.match(/import \{ toInventoryPresentationLanguage \}/g) ||
      [];

    expect(functionMatches).toHaveLength(1);
    expect(variantImportMatches).toHaveLength(1);
    expect(codeImportMatches).toHaveLength(1);

    expect(variantFormSource).toContain(
      "toInventoryPresentationLanguage(controller.mutationError)",
    );

    expect(codeFormSource).toContain(
      "toInventoryPresentationLanguage(controller.codeError)",
    );
  });
});
