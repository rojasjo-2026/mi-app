import { Prisma } from "@prisma/client";

import { InventoryDocumentReversalError } from "./inventoryDocumentReversal.types";

type ReversalTransaction = Prisma.TransactionClient;

type DecimalInput = Prisma.Decimal | string | number;

export type ReversalSourceMovement = {
  inventory_movement_id: string;
  inventory_product_variant_id: string;
  inventory_location_id: string;
  quantity_delta: Prisma.Decimal;
  unit_cost: Prisma.Decimal;
  total_cost_delta: Prisma.Decimal;

  variant: {
    product: {
      name: string;
      allow_negative_stock: boolean;
    };
  };
};

type ReversalBalanceGroup = {
  inventoryProductVariantId: string;
  inventoryLocationId: string;
  productName: string;
  allowsNegativeStock: boolean;
  quantityDelta: Prisma.Decimal;
  totalCostDelta: Prisma.Decimal;
  fallbackUnitCost: Prisma.Decimal;
};

type ReversalBalancePlan = {
  balanceId: string | null;
  inventoryProductVariantId: string;
  inventoryLocationId: string;
  newQuantity: Prisma.Decimal;
  reservedQuantity: Prisma.Decimal;
  newAverageCost: Prisma.Decimal;
};

function toDecimal(value: DecimalInput) {
  return new Prisma.Decimal(value);
}

function roundMoney(value: DecimalInput) {
  return toDecimal(value).toDecimalPlaces(4);
}

function buildBalanceKey(
  inventoryProductVariantId: string,
  inventoryLocationId: string,
) {
  return `${inventoryProductVariantId}:` + inventoryLocationId;
}

function buildBalanceErrorField(group: ReversalBalanceGroup) {
  return (
    `balances.` +
    `${group.inventoryProductVariantId}.` +
    group.inventoryLocationId
  );
}

function groupReversalMovements(movements: ReversalSourceMovement[]) {
  const groups = new Map<string, ReversalBalanceGroup>();

  for (const movement of movements) {
    const key = buildBalanceKey(
      movement.inventory_product_variant_id,
      movement.inventory_location_id,
    );

    const reversalQuantity = toDecimal(movement.quantity_delta).negated();

    const reversalValue = toDecimal(movement.total_cost_delta).negated();

    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.quantityDelta =
        existingGroup.quantityDelta.plus(reversalQuantity);

      existingGroup.totalCostDelta =
        existingGroup.totalCostDelta.plus(reversalValue);

      continue;
    }

    groups.set(key, {
      inventoryProductVariantId: movement.inventory_product_variant_id,

      inventoryLocationId: movement.inventory_location_id,

      productName: movement.variant.product.name,

      allowsNegativeStock: movement.variant.product.allow_negative_stock,

      quantityDelta: reversalQuantity,

      totalCostDelta: reversalValue,

      fallbackUnitCost: roundMoney(movement.unit_cost),
    });
  }

  return [...groups.values()];
}

function resolveNegativeQuantityAverageCost(group: ReversalBalanceGroup) {
  if (!group.quantityDelta.eq(0)) {
    return roundMoney(group.totalCostDelta.dividedBy(group.quantityDelta));
  }

  return group.fallbackUnitCost;
}

function resolveNewAverageCost(
  group: ReversalBalanceGroup,
  newQuantity: Prisma.Decimal,
  newInventoryValue: Prisma.Decimal,
) {
  if (newQuantity.eq(0)) {
    return toDecimal(0);
  }

  if (newQuantity.lt(0)) {
    return resolveNegativeQuantityAverageCost(group);
  }

  if (newInventoryValue.lt(0)) {
    throw new InventoryDocumentReversalError(
      "INVALID_STOCK_BALANCE",
      `La reversión produciría un valor de inventario inválido para ${group.productName}.`,
      {
        [buildBalanceErrorField(group)]:
          "El valor resultante del inventario sería negativo.",
      },
    );
  }

  return roundMoney(newInventoryValue.dividedBy(newQuantity));
}

async function buildBalancePlan(
  transaction: ReversalTransaction,
  group: ReversalBalanceGroup,
): Promise<ReversalBalancePlan> {
  const balance = await transaction.inventoryStockBalance.findUnique({
    where: {
      inventory_product_variant_id_inventory_location_id: {
        inventory_product_variant_id: group.inventoryProductVariantId,

        inventory_location_id: group.inventoryLocationId,
      },
    },
  });

  const currentQuantity = balance
    ? toDecimal(balance.quantity_on_hand)
    : toDecimal(0);

  const reservedQuantity = balance
    ? toDecimal(balance.quantity_reserved)
    : toDecimal(0);

  const currentAverageCost = balance
    ? roundMoney(balance.average_unit_cost)
    : toDecimal(0);

  const availableQuantity = currentQuantity.minus(reservedQuantity);

  if (
    group.quantityDelta.lt(0) &&
    !group.allowsNegativeStock &&
    availableQuantity.lt(group.quantityDelta.abs())
  ) {
    throw new InventoryDocumentReversalError(
      "INSUFFICIENT_STOCK",
      `No hay existencias suficientes para revertir ${group.productName}.`,
      {
        [buildBalanceErrorField(group)]:
          `Disponible: ${availableQuantity.toString()}. ` +
          `Requerido: ${group.quantityDelta.abs().toString()}.`,
      },
    );
  }

  const newQuantity = currentQuantity.plus(group.quantityDelta);

  const currentInventoryValue = currentQuantity.times(currentAverageCost);

  const newInventoryValue = currentInventoryValue.plus(group.totalCostDelta);

  const newAverageCost = resolveNewAverageCost(
    group,
    newQuantity,
    newInventoryValue,
  );

  return {
    balanceId: balance?.inventory_stock_balance_id ?? null,

    inventoryProductVariantId: group.inventoryProductVariantId,

    inventoryLocationId: group.inventoryLocationId,

    newQuantity,
    reservedQuantity,
    newAverageCost,
  };
}

async function applyBalancePlan(
  transaction: ReversalTransaction,
  plan: ReversalBalancePlan,
) {
  if (plan.balanceId) {
    await transaction.inventoryStockBalance.update({
      where: {
        inventory_stock_balance_id: plan.balanceId,
      },

      data: {
        quantity_on_hand: plan.newQuantity,

        average_unit_cost: plan.newAverageCost,

        version: {
          increment: 1,
        },
      },
    });

    return;
  }

  await transaction.inventoryStockBalance.create({
    data: {
      inventory_product_variant_id: plan.inventoryProductVariantId,

      inventory_location_id: plan.inventoryLocationId,

      quantity_on_hand: plan.newQuantity,

      quantity_reserved: plan.reservedQuantity,

      average_unit_cost: plan.newAverageCost,
    },
  });
}

export async function applyInventoryDocumentReversalBalances(
  transaction: ReversalTransaction,
  movements: ReversalSourceMovement[],
) {
  const groups = groupReversalMovements(movements);

  const plans: ReversalBalancePlan[] = [];

  for (const group of groups) {
    plans.push(await buildBalancePlan(transaction, group));
  }

  for (const plan of plans) {
    await applyBalancePlan(transaction, plan);
  }
}
