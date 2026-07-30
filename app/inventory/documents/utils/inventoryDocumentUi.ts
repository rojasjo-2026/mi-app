import type {
  InventoryDocument,
  InventoryDocumentStatus,
  InventoryDocumentType,
} from "../types";

const DOCUMENT_TYPE_LABELS: Record<InventoryDocumentType, string> = {
  OPENING_BALANCE: "Saldo inicial",
  RECEIPT: "Entrada",
  ISSUE: "Salida",
  TRANSFER: "Transferencia",
  ADJUSTMENT_INCREASE: "Ajuste positivo",
  ADJUSTMENT_DECREASE: "Ajuste negativo",
  RETURN_IN: "Devolución entrante",
  RETURN_OUT: "Devolución saliente",
};

const DOCUMENT_STATUS_LABELS: Record<InventoryDocumentStatus, string> = {
  DRAFT: "Borrador",
  POSTED: "Publicado",
  IN_TRANSIT: "En tránsito",
  PARTIALLY_RECEIVED: "Recibido parcialmente",
  RECEIVED: "Recibido",
  CANCELLED: "Cancelado",
  REVERSED: "Reversado",
};

export function parseInventoryDocumentDecimal(
  value: string | number | null | undefined,
) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatInventoryDocumentType(value: InventoryDocumentType) {
  return DOCUMENT_TYPE_LABELS[value];
}

export function formatInventoryDocumentStatus(value: InventoryDocumentStatus) {
  return DOCUMENT_STATUS_LABELS[value];
}

export function getInventoryDocumentStatusClassName(
  status: InventoryDocumentStatus,
) {
  switch (status) {
    case "DRAFT":
      return "border-slate-200 bg-slate-100 text-slate-600";

    case "POSTED":
    case "RECEIVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "IN_TRANSIT":
    case "PARTIALLY_RECEIVED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "CANCELLED":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "REVERSED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-white text-slate-600";
  }
}

export function formatInventoryDocumentMoney(
  value: string | number,
  locale: string,
  currency: string,
) {
  const amount = parseInventoryDocumentDecimal(value);

  if (!currency) {
    return amount.toLocaleString(locale || "es", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  try {
    return new Intl.NumberFormat(locale || "es", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return amount.toLocaleString("es", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}

export function formatInventoryDocumentQuantity(
  value: string | number,
  locale: string,
  decimalScale = 2,
) {
  const amount = parseInventoryDocumentDecimal(value);

  return amount.toLocaleString(locale || "es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(Math.max(decimalScale, 0), 6),
  });
}

export function formatInventoryDocumentDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  try {
    return new Intl.DateTimeFormat(locale || "es", {
      dateStyle: "medium",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
    }).format(date);
  }
}

export function formatInventoryDocumentDateTime(
  value: string | null,
  locale: string,
) {
  if (!value) {
    return "No registrado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  try {
    return new Intl.DateTimeFormat(locale || "es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

export function getInventoryDocumentLocationLabel(
  location: InventoryDocument["source_location"],
) {
  if (!location) {
    return "Sin ubicación";
  }

  return `${location.name} (${location.location_code})`;
}

export function getInventoryDocumentRouteLabel(document: InventoryDocument) {
  const source = document.source_location?.name;

  const destination = document.destination_location?.name;

  if (source && destination) {
    return `${source} → ${destination}`;
  }

  if (source) {
    return source;
  }

  if (destination) {
    return destination;
  }

  return "Sin ubicación asignada";
}

export function getInventoryDocumentVariantLabel(
  variantName: string | null,
  isDefault: boolean,
) {
  if (variantName) {
    return variantName;
  }

  return isDefault ? "Variante predeterminada" : "Sin nombre de variante";
}
