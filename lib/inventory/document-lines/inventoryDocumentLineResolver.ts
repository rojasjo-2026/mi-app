import { Prisma } from "@prisma/client";

import { InventoryValidationError } from "../shared/inventoryErrors";

import {
  findInventoryDocumentLineCodeContext,
  findInventoryDocumentLineUnitContext,
  findInventoryDocumentLineVariantContext,
} from "./inventoryDocumentLine.repository";

import type {
  InventoryDocumentLineCreateInputData,
  InventoryDocumentLineResolvedData,
} from "./inventoryDocumentLine.types";

type QuantityUnitContext = {
  code: string;
  allows_decimal: boolean;
  decimal_scale: number;
};

function throwLineError(
  message: string,
  field: string,
  fieldMessage: string,
  status = 409,
): never {
  throw new InventoryValidationError(message, {
    status,
    errors: {
      [field]: fieldMessage,
    },
  });
}

function validateQuantityForUnit(
  quantity: Prisma.Decimal,
  unit: QuantityUnitContext,
  field: string,
  fieldLabel: string,
) {
  if (!unit.allows_decimal && !quantity.isInteger()) {
    throwLineError(
      `${fieldLabel} no puede contener decimales para la unidad ${unit.code}.`,
      field,
      `La unidad ${unit.code} solo permite cantidades enteras.`,
      400,
    );
  }

  if (quantity.decimalPlaces() > unit.decimal_scale) {
    throwLineError(
      `${fieldLabel} supera la precisión permitida para la unidad ${unit.code}.`,
      field,
      `La unidad ${unit.code} permite hasta ${unit.decimal_scale} decimales.`,
      400,
    );
  }
}

function getIntegerDigitCount(value: Prisma.Decimal) {
  const integerText = value
    .abs()
    .trunc()
    .toFixed(0)
    .replace(/^0+(?=\d)/, "");

  return integerText.length;
}

function validateDecimalStorage(params: {
  value: Prisma.Decimal;
  precision: number;
  scale: number;
  field: string;
  fieldLabel: string;
}) {
  const decimalPlaces = params.value.decimalPlaces();

  if (decimalPlaces > params.scale) {
    throwLineError(
      `${params.fieldLabel} supera la precisión permitida.`,
      params.field,
      `Solo se permiten ${params.scale} decimales.`,
      400,
    );
  }

  const totalDigits = getIntegerDigitCount(params.value) + decimalPlaces;

  if (totalDigits > params.precision) {
    throwLineError(
      `${params.fieldLabel} supera el tamaño permitido.`,
      params.field,
      `No puede superar ${params.precision} dígitos.`,
      400,
    );
  }
}

export async function resolveInventoryDocumentLineData(
  input: InventoryDocumentLineCreateInputData,
): Promise<InventoryDocumentLineResolvedData> {
  const [variant, unit, productCode] = await Promise.all([
    findInventoryDocumentLineVariantContext(input.inventory_product_variant_id),
    findInventoryDocumentLineUnitContext(input.unit_of_measure_id),
    input.inventory_product_code_id
      ? findInventoryDocumentLineCodeContext(input.inventory_product_code_id)
      : Promise.resolve(null),
  ]);

  if (!variant) {
    throwLineError(
      "No se encontró la variante seleccionada.",
      "inventory_product_variant_id",
      "La variante indicada no existe.",
      404,
    );
  }

  if (!variant.is_active) {
    throwLineError(
      "La variante seleccionada está desactivada.",
      "inventory_product_variant_id",
      "Seleccione una variante activa.",
    );
  }

  if (!variant.product.is_active) {
    throwLineError(
      "El producto relacionado está desactivado.",
      "inventory_product_variant_id",
      "Seleccione una variante de un producto activo.",
    );
  }

  if (!variant.product.manages_stock) {
    throwLineError(
      "El producto seleccionado no administra existencias.",
      "inventory_product_variant_id",
      "Seleccione un producto que administre inventario.",
    );
  }

  if (!variant.stock_unit.is_active) {
    throwLineError(
      "La unidad de inventario de la variante está desactivada.",
      "inventory_product_variant_id",
      "Active la unidad de inventario antes de utilizar la variante.",
    );
  }

  if (!unit) {
    throwLineError(
      "No se encontró la unidad de medida seleccionada.",
      "unit_of_measure_id",
      "La unidad indicada no existe.",
      404,
    );
  }

  if (!unit.is_active) {
    throwLineError(
      "La unidad de medida seleccionada está desactivada.",
      "unit_of_measure_id",
      "Seleccione una unidad activa.",
    );
  }

  let conversionFactor = new Prisma.Decimal(input.conversion_factor);

  let codeSnapshot: string | null = null;

  if (input.inventory_product_code_id) {
    if (!productCode) {
      throwLineError(
        "No se encontró el código seleccionado.",
        "inventory_product_code_id",
        "El código indicado no existe.",
        404,
      );
    }

    if (!productCode.is_active) {
      throwLineError(
        "El código seleccionado está desactivado.",
        "inventory_product_code_id",
        "Seleccione un código activo.",
      );
    }

    if (
      productCode.inventory_product_variant_id !==
      variant.inventory_product_variant_id
    ) {
      throwLineError(
        "El código no pertenece a la variante seleccionada.",
        "inventory_product_code_id",
        "Seleccione un código asociado con la variante.",
        400,
      );
    }

    const expectedUnitId =
      productCode.unit_of_measure_id ?? variant.stock_unit_id;

    if (expectedUnitId !== unit.unit_of_measure_id) {
      throwLineError(
        "La unidad de medida no coincide con el código seleccionado.",
        "unit_of_measure_id",
        "Utilice la unidad configurada para el código.",
        400,
      );
    }

    conversionFactor = productCode.quantity_in_stock_unit;

    codeSnapshot = productCode.code;
  } else if (unit.unit_of_measure_id === variant.stock_unit_id) {
    if (!conversionFactor.equals(1)) {
      throwLineError(
        "La unidad base de inventario debe utilizar un factor de conversión igual a 1.",
        "conversion_factor",
        "Indique un factor de conversión igual a 1.",
        400,
      );
    }

    conversionFactor = new Prisma.Decimal(1);
  }

  const quantity = new Prisma.Decimal(input.quantity);

  const unitCost = new Prisma.Decimal(input.unit_cost);

  validateQuantityForUnit(quantity, unit, "quantity", "La cantidad");

  const stockQuantity = quantity.mul(conversionFactor);

  validateQuantityForUnit(
    stockQuantity,
    variant.stock_unit,
    "stock_quantity",
    "La cantidad convertida",
  );

  validateDecimalStorage({
    value: stockQuantity,
    precision: 18,
    scale: 6,
    field: "stock_quantity",
    fieldLabel: "La cantidad convertida",
  });

  const totalCost = stockQuantity
    .mul(unitCost)
    .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

  validateDecimalStorage({
    value: totalCost,
    precision: 16,
    scale: 4,
    field: "total_cost",
    fieldLabel: "El costo total",
  });

  return {
    inventory_product_variant_id: variant.inventory_product_variant_id,
    inventory_product_code_id: productCode?.inventory_product_code_id ?? null,
    unit_of_measure_id: unit.unit_of_measure_id,
    quantity: quantity.toString(),
    conversion_factor: conversionFactor.toString(),
    stock_quantity: stockQuantity.toString(),
    unit_cost: unitCost.toString(),
    total_cost: totalCost.toString(),
    product_name_snapshot: variant.product.name,
    variant_name_snapshot: variant.name,
    unit_code_snapshot: unit.code,
    code_snapshot: codeSnapshot,
    notes: input.notes,
  };
}
