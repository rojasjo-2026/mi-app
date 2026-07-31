import type { InventoryMovement } from "../types";

const movementLabels: Record<string, string> = {
  INBOUND: "Entrada",
  OUTBOUND: "Salida",
  TRANSFER_RECEIPT: "Transferencia recibida",
  TRANSFER_DISPATCH: "Transferencia despachada",
  ADJUSTMENT_IN: "Ajuste positivo",
  ADJUSTMENT_OUT: "Ajuste negativo",
  REVERSAL: "Reversión",
};

const documentTypeLabels: Record<string, string> = {
  RECEIPT: "Entrada",
  ISSUE: "Salida",
  TRANSFER: "Transferencia",
  ADJUSTMENT_IN: "Ajuste positivo",
  ADJUSTMENT_OUT: "Ajuste negativo",
};

const documentStatusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  POSTED: "Publicado",
  IN_TRANSIT: "En tránsito",
  PARTIALLY_RECEIVED: "Recibido parcialmente",
  RECEIVED: "Recibido",
  CANCELLED: "Cancelado",
  REVERSED: "Reversado",
};

function humanizeInventoryValue(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseInventoryMovementDecimal(
  value: string | number | null | undefined,
) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatInventoryMovementQuantity(
  value: string | number,
  locale: string,
  decimalScale = 3,
) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.max(0, decimalScale),
  }).format(parseInventoryMovementDecimal(value));
}

export function formatInventoryMovementMoney(
  value: string | number,
  locale: string,
  currency: string,
) {
  const amount = parseInventoryMovementDecimal(value);

  if (!currency) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatInventoryMovementDateTime(
  value: string | null | undefined,
  locale: string,
) {
  if (!value) {
    return "No registrado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No registrado";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatInventoryMovementDate(
  value: string | null | undefined,
  locale: string,
) {
  if (!value) {
    return "No registrado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No registrado";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
}

export function getInventoryMovementLabel(movementType: string) {
  return movementLabels[movementType] || humanizeInventoryValue(movementType);
}

export function getInventoryDocumentTypeLabel(documentType: string) {
  return (
    documentTypeLabels[documentType] || humanizeInventoryValue(documentType)
  );
}

export function getInventoryDocumentStatusLabel(status: string) {
  return documentStatusLabels[status] || humanizeInventoryValue(status);
}

export function getInventoryMovementVariantLabel(movement: InventoryMovement) {
  return (
    movement.variant.name ||
    (movement.variant.is_default
      ? "Presentación estándar"
      : "Variante sin nombre")
  );
}

export function getInventoryMovementUnitLabel(movement: InventoryMovement) {
  const symbol = movement.stock_unit.symbol || movement.stock_unit.code;

  return `${movement.stock_unit.name} (${symbol})`;
}

export function getInventoryMovementDirection(movement: InventoryMovement) {
  const quantityDelta = parseInventoryMovementDecimal(movement.quantity_delta);

  if (quantityDelta > 0) {
    return "IN";
  }

  if (quantityDelta < 0) {
    return "OUT";
  }

  return "NEUTRAL";
}

export function getInventoryMovementBadgeClass(movement: InventoryMovement) {
  if (
    movement.movement_type === "REVERSAL" ||
    movement.reversal_of_movement_id
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  const direction = getInventoryMovementDirection(movement);

  if (direction === "IN") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (direction === "OUT") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}
