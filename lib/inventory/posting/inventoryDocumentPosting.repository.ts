import {
  InventoryDocumentStatus,
  InventoryMovementType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  getInventoryDocumentPostingLocationField,
  resolveInventoryDocumentPostingDirection,
} from "./inventoryDocumentPosting.validators";

import {
  InventoryDocumentPostingError,
  type InventoryDocumentPostingDirection,
  type InventoryDocumentPostingTransactionResult,
} from "./inventoryDocumentPosting.types";

const MAX_TRANSACTION_ATTEMPTS = 3;
const MONEY_DECIMAL_PLACES = 4;

const postingLocationSelect = {
  inventory_location_id: true,
  location_code: true,
  name: true,
  allows_stock: true,
  is_active: true,
} as const;

const postingProductSelect = {
  inventory_product_id: true,
  name: true,
  manages_stock: true,
  allow_negative_stock: true,
  is_active: true,
} as const;

const postingStockUnitSelect = {
  unit_of_measure_id: true,
  code: true,
  is_active: true,
} as const;

const postingDocumentInclude = {
  source_location: {
    select: postingLocationSelect,
  },
  destination_location: {
    select: postingLocationSelect,
  },
  lines: {
    include: {
      variant: {
        include: {
          product: {
            select: postingProductSelect,
          },
          stock_unit: {
            select: postingStockUnitSelect,
          },
        },
      },
    },
    orderBy: {
      line_number: "asc",
    },
  },
} as const;

type PostingDocument = Prisma.InventoryDocumentGetPayload<{
  include: typeof postingDocumentInclude;
}>;

type PostingDocumentLine = PostingDocument["lines"][number];

type PostingLocation = NonNullable<PostingDocument["source_location"]>;

type PostingTransaction = Prisma.TransactionClient;

type PostingLineResult = {
  movementType: InventoryMovementType;
  quantityDelta: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  totalCostDelta: Prisma.Decimal;
};

type DecimalInput = Prisma.Decimal | string | number;

function toDecimal(value: DecimalInput) {
  return new Prisma.Decimal(value);
}

function roundMoney(value: DecimalInput) {
  return toDecimal(value).toDecimalPlaces(MONEY_DECIMAL_PLACES);
}

function buildPostingKey(
  inventoryDocumentId: string,
  inventoryDocumentLineId: string,
) {
  return ["POST", inventoryDocumentId, inventoryDocumentLineId].join(":");
}

function buildLineErrorField(line: PostingDocumentLine, field: string) {
  return `lines.${line.line_number}.${field}`;
}

function validatePostingLine(line: PostingDocumentLine) {
  const lineLabel = line.product_name_snapshot || `Línea ${line.line_number}`;

  if (!line.variant.product.is_active) {
    throw new InventoryDocumentPostingError(
      "PRODUCT_INACTIVE",
      `El producto ${lineLabel} está desactivado.`,
      {
        [buildLineErrorField(line, "inventory_product_variant_id")]:
          "El producto relacionado debe estar activo.",
      },
    );
  }

  if (!line.variant.product.manages_stock) {
    throw new InventoryDocumentPostingError(
      "PRODUCT_STOCK_DISABLED",
      `El producto ${lineLabel} no administra existencias.`,
      {
        [buildLineErrorField(line, "inventory_product_variant_id")]:
          "Seleccione un producto que administre existencias.",
      },
    );
  }

  if (!line.variant.is_active) {
    throw new InventoryDocumentPostingError(
      "VARIANT_INACTIVE",
      `La variante de ${lineLabel} está desactivada.`,
      {
        [buildLineErrorField(line, "inventory_product_variant_id")]:
          "La variante debe estar activa.",
      },
    );
  }

  if (!line.variant.stock_unit.is_active) {
    throw new InventoryDocumentPostingError(
      "STOCK_UNIT_INACTIVE",
      `La unidad de inventario de ${lineLabel} está desactivada.`,
      {
        [buildLineErrorField(line, "unit_of_measure_id")]:
          "La unidad de inventario debe estar activa.",
      },
    );
  }

  const stockQuantity = toDecimal(line.stock_quantity);

  if (!stockQuantity.isFinite() || stockQuantity.lte(0)) {
    throw new InventoryDocumentPostingError(
      "INVALID_LINE_QUANTITY",
      `La cantidad de inventario de ${lineLabel} no es válida.`,
      {
        [buildLineErrorField(line, "stock_quantity")]:
          "La cantidad de inventario debe ser mayor que cero.",
      },
    );
  }
}

function resolvePostingLocation(
  document: PostingDocument,
  direction: InventoryDocumentPostingDirection,
): PostingLocation {
  const locationField = getInventoryDocumentPostingLocationField(direction);

  const location =
    direction === "INBOUND"
      ? document.destination_location
      : document.source_location;

  if (!location) {
    throw new InventoryDocumentPostingError(
      "LOCATION_REQUIRED",
      "El documento no tiene la ubicación requerida para su publicación.",
      {
        [locationField]: "Seleccione la ubicación requerida.",
      },
    );
  }

  if (!location.is_active) {
    throw new InventoryDocumentPostingError(
      "LOCATION_INACTIVE",
      `La ubicación ${location.name} está desactivada.`,
      {
        [locationField]: "Seleccione una ubicación activa.",
      },
    );
  }

  if (!location.allows_stock) {
    throw new InventoryDocumentPostingError(
      "LOCATION_STOCK_DISABLED",
      `La ubicación ${location.name} no permite almacenar existencias.`,
      {
        [locationField]: "Seleccione una ubicación que permita existencias.",
      },
    );
  }

  return location;
}

async function findCurrentBalance(
  transaction: PostingTransaction,
  inventoryProductVariantId: string,
  inventoryLocationId: string,
) {
  return transaction.inventoryStockBalance.findUnique({
    where: {
      inventory_product_variant_id_inventory_location_id: {
        inventory_product_variant_id: inventoryProductVariantId,
        inventory_location_id: inventoryLocationId,
      },
    },
  });
}

async function applyInboundLine(
  transaction: PostingTransaction,
  line: PostingDocumentLine,
  inventoryLocationId: string,
): Promise<PostingLineResult> {
  const stockQuantity = toDecimal(line.stock_quantity);

  const incomingUnitCost = roundMoney(line.unit_cost);

  const currentBalance = await findCurrentBalance(
    transaction,
    line.inventory_product_variant_id,
    inventoryLocationId,
  );

  const currentQuantity = currentBalance
    ? toDecimal(currentBalance.quantity_on_hand)
    : toDecimal(0);

  const currentAverageCost = currentBalance
    ? roundMoney(currentBalance.average_unit_cost)
    : toDecimal(0);

  const newQuantity = currentQuantity.plus(stockQuantity);

  const newAverageCost = currentQuantity.lte(0)
    ? incomingUnitCost
    : roundMoney(
        currentQuantity
          .times(currentAverageCost)
          .plus(stockQuantity.times(incomingUnitCost))
          .dividedBy(newQuantity),
      );

  if (currentBalance) {
    await transaction.inventoryStockBalance.update({
      where: {
        inventory_stock_balance_id: currentBalance.inventory_stock_balance_id,
      },
      data: {
        quantity_on_hand: newQuantity,
        average_unit_cost: newAverageCost,
        version: {
          increment: 1,
        },
      },
    });
  } else {
    await transaction.inventoryStockBalance.create({
      data: {
        inventory_product_variant_id: line.inventory_product_variant_id,
        inventory_location_id: inventoryLocationId,
        quantity_on_hand: newQuantity,
        quantity_reserved: toDecimal(0),
        average_unit_cost: newAverageCost,
      },
    });
  }

  const lineTotal = roundMoney(stockQuantity.times(incomingUnitCost));

  return {
    movementType: InventoryMovementType.INBOUND,
    quantityDelta: stockQuantity,
    unitCost: incomingUnitCost,
    lineTotal,
    totalCostDelta: lineTotal,
  };
}

async function applyOutboundLine(
  transaction: PostingTransaction,
  line: PostingDocumentLine,
  inventoryLocationId: string,
): Promise<PostingLineResult> {
  const stockQuantity = toDecimal(line.stock_quantity);

  const currentBalance = await findCurrentBalance(
    transaction,
    line.inventory_product_variant_id,
    inventoryLocationId,
  );

  const currentQuantity = currentBalance
    ? toDecimal(currentBalance.quantity_on_hand)
    : toDecimal(0);

  const reservedQuantity = currentBalance
    ? toDecimal(currentBalance.quantity_reserved)
    : toDecimal(0);

  const availableQuantity = currentQuantity.minus(reservedQuantity);

  const allowsNegativeStock = line.variant.product.allow_negative_stock;

  if (!allowsNegativeStock && availableQuantity.lt(stockQuantity)) {
    throw new InventoryDocumentPostingError(
      "INSUFFICIENT_STOCK",
      `No hay existencias suficientes para ${line.product_name_snapshot}.`,
      {
        [buildLineErrorField(line, "stock_quantity")]:
          `Disponible: ${availableQuantity.toString()}. ` +
          `Solicitado: ${stockQuantity.toString()}.`,
      },
    );
  }

  const postingUnitCost = currentBalance
    ? roundMoney(currentBalance.average_unit_cost)
    : roundMoney(line.unit_cost);

  const newQuantity = currentQuantity.minus(stockQuantity);

  if (currentBalance) {
    await transaction.inventoryStockBalance.update({
      where: {
        inventory_stock_balance_id: currentBalance.inventory_stock_balance_id,
      },
      data: {
        quantity_on_hand: newQuantity,
        version: {
          increment: 1,
        },
      },
    });
  } else {
    await transaction.inventoryStockBalance.create({
      data: {
        inventory_product_variant_id: line.inventory_product_variant_id,
        inventory_location_id: inventoryLocationId,
        quantity_on_hand: newQuantity,
        quantity_reserved: toDecimal(0),
        average_unit_cost: postingUnitCost,
      },
    });
  }

  const lineTotal = roundMoney(stockQuantity.times(postingUnitCost));

  return {
    movementType: InventoryMovementType.OUTBOUND,
    quantityDelta: stockQuantity.negated(),
    unitCost: postingUnitCost,
    lineTotal,
    totalCostDelta: lineTotal.negated(),
  };
}

async function executePostingTransaction(
  transaction: PostingTransaction,
  inventoryDocumentId: string,
): Promise<InventoryDocumentPostingTransactionResult> {
  const document = await transaction.inventoryDocument.findUnique({
    where: {
      inventory_document_id: inventoryDocumentId,
    },
    include: postingDocumentInclude,
  });

  if (!document) {
    throw new InventoryDocumentPostingError(
      "DOCUMENT_NOT_FOUND",
      "El documento de inventario no existe.",
      {
        inventory_document_id: "No se encontró el documento solicitado.",
      },
    );
  }

  if (document.status === InventoryDocumentStatus.POSTED) {
    return {
      inventoryDocumentId: document.inventory_document_id,
      outcome: "ALREADY_POSTED",
    };
  }

  if (document.status !== InventoryDocumentStatus.DRAFT) {
    throw new InventoryDocumentPostingError(
      "INVALID_DOCUMENT_STATUS",
      `El documento con estado ${document.status} no puede publicarse.`,
      {
        status: "Solo los documentos en borrador pueden publicarse.",
      },
    );
  }

  const direction = resolveInventoryDocumentPostingDirection(
    document.document_type,
  );

  if (document.lines.length === 0) {
    throw new InventoryDocumentPostingError(
      "EMPTY_DOCUMENT",
      "El documento debe contener al menos una línea.",
      {
        lines: "Agregue al menos una línea antes de publicar.",
      },
    );
  }

  const location = resolvePostingLocation(document, direction);

  const postingTimestamp = new Date();
  let documentTotal = toDecimal(0);

  for (const line of document.lines) {
    validatePostingLine(line);

    const lineResult =
      direction === "INBOUND"
        ? await applyInboundLine(
            transaction,
            line,
            location.inventory_location_id,
          )
        : await applyOutboundLine(
            transaction,
            line,
            location.inventory_location_id,
          );

    await transaction.inventoryDocumentLine.update({
      where: {
        inventory_document_line_id: line.inventory_document_line_id,
      },
      data: {
        unit_cost: lineResult.unitCost,
        total_cost: lineResult.lineTotal,
      },
    });

    await transaction.inventoryMovement.create({
      data: {
        inventory_document_id: document.inventory_document_id,
        inventory_document_line_id: line.inventory_document_line_id,
        inventory_product_variant_id: line.inventory_product_variant_id,
        inventory_location_id: location.inventory_location_id,
        posting_key: buildPostingKey(
          document.inventory_document_id,
          line.inventory_document_line_id,
        ),
        movement_type: lineResult.movementType,
        quantity_delta: lineResult.quantityDelta,
        unit_cost: lineResult.unitCost,
        total_cost_delta: lineResult.totalCostDelta,
        movement_at: postingTimestamp,
        notes: line.notes,
        created_by: null,
      },
    });

    documentTotal = documentTotal.plus(lineResult.lineTotal);
  }

  const updateResult = await transaction.inventoryDocument.updateMany({
    where: {
      inventory_document_id: document.inventory_document_id,
      status: InventoryDocumentStatus.DRAFT,
    },
    data: {
      status: InventoryDocumentStatus.POSTED,
      total_cost: roundMoney(documentTotal),
      posted_at: postingTimestamp,
    },
  });

  if (updateResult.count !== 1) {
    throw new InventoryDocumentPostingError(
      "INVALID_DOCUMENT_STATUS",
      "El documento cambió de estado durante su publicación.",
      {
        status: "Actualice el documento e intente nuevamente.",
      },
    );
  }

  return {
    inventoryDocumentId: document.inventory_document_id,
    outcome: "POSTED",
  };
}

function isTransactionConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function postInventoryDocumentRecord(inventoryDocumentId: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        (transaction) =>
          executePostingTransaction(transaction, inventoryDocumentId),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      lastError = error;

      if (
        !isTransactionConflict(error) ||
        attempt === MAX_TRANSACTION_ATTEMPTS
      ) {
        throw error;
      }
    }
  }

  throw lastError ?? new Error("No fue posible publicar el documento.");
}
