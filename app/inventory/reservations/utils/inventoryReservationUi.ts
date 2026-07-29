import type {
  InventoryReservationActionAvailability,
  InventoryReservationDetail,
  InventoryReservationExpirationSummary,
  InventoryReservationListItem,
  InventoryReservationStatus,
} from "../types";

const STATUS_LABELS: Record<InventoryReservationStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  PARTIALLY_CONSUMED: "Consumo parcial",
  CONSUMED: "Consumida",
  RELEASED: "Liberada",
  EXPIRED: "Vencida",
  CANCELLED: "Cancelada",
};

const STATUS_CLASSES: Record<InventoryReservationStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  ACTIVE: "border-blue-200 bg-blue-50 text-blue-700",
  PARTIALLY_CONSUMED: "border-amber-200 bg-amber-50 text-amber-700",
  CONSUMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RELEASED: "border-violet-200 bg-violet-50 text-violet-700",
  EXPIRED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-300 bg-slate-100 text-slate-500",
};

const EVENT_LABELS: Record<string, string> = {
  CREATED: "Reserva creada",
  ACTIVATED: "Reserva activada",
  CONSUMED: "Inventario consumido",
  RELEASED: "Cantidad liberada",
  EXPIRED: "Reserva expirada",
  CANCELLED: "Reserva cancelada",
};

export function getReservationStatusLabel(status: InventoryReservationStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function getReservationStatusClasses(
  status: InventoryReservationStatus,
) {
  return STATUS_CLASSES[status] ?? STATUS_CLASSES.DRAFT;
}

export function getReservationEventLabel(eventType: string) {
  if (EVENT_LABELS[eventType]) {
    return EVENT_LABELS[eventType];
  }

  return eventType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatInventoryQuantity(
  value: string | number | null | undefined,
  locale: string,
) {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return String(value);
  }

  try {
    return new Intl.NumberFormat(locale || "es", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(parsedValue);
  } catch {
    return new Intl.NumberFormat("es", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(parsedValue);
  }
}

export function formatInventoryDate(
  value: string | null | undefined,
  locale: string,
  includeTime = false,
) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  const options: Intl.DateTimeFormatOptions = includeTime
    ? {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    : {
        day: "2-digit",
        month: "short",
        year: "numeric",
      };

  try {
    return date.toLocaleDateString(locale || "es", options);
  } catch {
    return date.toLocaleDateString("es", options);
  }
}

export function getExpirationLabel(
  expiration: InventoryReservationExpirationSummary,
  expiresAt: string | null,
  locale: string,
) {
  if (!expiration.has_expiration || !expiresAt) {
    return {
      label: "Sin vencimiento",
      helper: "No tiene fecha limite",
      className: "text-slate-600",
    };
  }

  if (expiration.is_overdue) {
    const expirationTime = new Date(expiresAt).getTime();

    const overdueMilliseconds = Math.max(0, Date.now() - expirationTime);

    const overdueDays = Math.floor(overdueMilliseconds / (24 * 60 * 60 * 1000));

    return {
      label: formatInventoryDate(expiresAt, locale),
      helper:
        overdueDays < 1
          ? "Vencida hace menos de 1 día"
          : `Vencida hace ${overdueDays} día${overdueDays === 1 ? "" : "s"}`,
      className: "text-red-700",
    };
  }

  if (expiration.is_expiring_soon) {
    const remainingDays = expiration.days_until_expiration ?? 0;

    return {
      label: formatInventoryDate(expiresAt, locale),
      helper:
        remainingDays === 0
          ? "Vence hoy"
          : `Vence en ${remainingDays} dia${remainingDays === 1 ? "" : "s"}`,
      className: "text-amber-700",
    };
  }

  return {
    label: formatInventoryDate(expiresAt, locale),
    helper: "Dentro del plazo",
    className: "text-slate-600",
  };
}

export function getPrimaryProductLabel(
  reservation: InventoryReservationListItem,
) {
  const firstProduct = reservation.products[0];

  if (!firstProduct) {
    return {
      title: "Sin producto",
      helper: "No hay lineas disponibles",
    };
  }

  const additionalProducts = reservation.products.length - 1;

  return {
    title: firstProduct.product_name,
    helper: [
      firstProduct.variant_name,
      additionalProducts > 0
        ? `+${additionalProducts} producto${additionalProducts === 1 ? "" : "s"}`
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

export function getPrimaryLocationLabel(
  reservation: InventoryReservationListItem,
) {
  const firstLocation = reservation.locations[0];

  if (!firstLocation) {
    return {
      title: "Sin ubicacion",
      helper: "No hay ubicaciones",
    };
  }

  const additionalLocations = reservation.locations.length - 1;

  return {
    title: firstLocation.location_name,
    helper: [
      firstLocation.location_code,
      additionalLocations > 0
        ? `+${additionalLocations} ubicacion${
            additionalLocations === 1 ? "" : "es"
          }`
        : null,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

export function getReferenceLabel(
  referenceType: string | null,
  referenceNumber: string | null,
  referenceId: string | null,
) {
  return {
    title: referenceNumber || referenceId || "Sin referencia",
    helper: referenceType || "Reserva manual",
  };
}

export function getAvailableActionLabels(
  actions: InventoryReservationActionAvailability,
) {
  const labels: string[] = [];

  if (actions.can_activate) {
    labels.push("Activar");
  }

  if (actions.can_consume) {
    labels.push("Consumir");
  }

  if (actions.can_release) {
    labels.push("Liberar");
  }

  if (actions.can_expire) {
    labels.push("Expirar");
  }

  if (actions.can_cancel) {
    labels.push("Cancelar");
  }

  return labels;
}

export function getReservationSituationText(
  reservation: InventoryReservationDetail,
  locale: string,
) {
  const requested = formatInventoryQuantity(
    reservation.quantity_totals.requested,
    locale,
  );

  const reserved = formatInventoryQuantity(
    reservation.quantity_totals.reserved,
    locale,
  );

  const consumed = formatInventoryQuantity(
    reservation.quantity_totals.consumed,
    locale,
  );

  const released = formatInventoryQuantity(
    reservation.quantity_totals.released,
    locale,
  );

  switch (reservation.status) {
    case "DRAFT":
      return `Se solicitaron ${requested} unidades. La reserva sigue en borrador y todavia no compromete existencias.`;

    case "ACTIVE":
      return `La reserva mantiene ${reserved} unidades comprometidas y disponibles para consumo o liberacion.`;

    case "PARTIALLY_CONSUMED":
      return `Se consumieron ${consumed} unidades y quedan ${reserved} unidades comprometidas.`;

    case "CONSUMED":
      return `La reserva fue consumida completamente. Se procesaron ${consumed} unidades.`;

    case "RELEASED":
      return `La cantidad pendiente fue liberada. El total liberado es ${released}.`;

    case "EXPIRED":
      return `La reserva alcanzó su fecha de vencimiento y liberó ${released} ${
        released === "1" ? "unidad" : "unidades"
      }.`;

    case "CANCELLED":
      return "La reserva fue cancelada antes de comprometer existencias.";

    default:
      return "La reserva se encuentra disponible para consulta.";
  }
}
