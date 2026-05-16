import type { Prisma } from "@prisma/client";

import {
  createActivityLog,
  createManyActivityLogs,
} from "@/lib/repositories/activityLogRepository";

type ActivitySourceRecord = Record<string, unknown>;

type FollowUpActivityField = {
  fieldName: string;
  title: string;
  description: string;
  category: "FOLLOW_UP" | "FINANCE";
  visibility: "PUBLIC_INTERNAL" | "FINANCE_ONLY";
  action: "UPDATED" | "STATUS_CHANGED";
  getValue?: (source: ActivitySourceRecord | null) => unknown;
};

type FinanceActivityAction =
  | "INVOICE_CREATED"
  | "INVOICE_UPDATED"
  | "INVOICE_CANCELLED"
  | "INVOICE_PAID"
  | "INVOICE_OVERDUE"
  | "PAYMENT_REGISTERED"
  | "PAYMENT_REVERSED"
  | "STATUS_CHANGED";

type FinanceActivityInput = {
  clientId: string;
  entityType: "INVOICE" | "INVOICE_PAYMENT";
  entityId: string;
  action: FinanceActivityAction;
  title: string;
  description?: string;
  fieldName?: string;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Prisma.InputJsonValue;
  createdBy?: string | null;
};

type InvoiceActivityField = {
  fieldName: string;
  title: string;
  description: string;
  action?: FinanceActivityAction;
};

const FOLLOW_UP_ACTIVITY_FIELDS: FollowUpActivityField[] = [
  {
    fieldName: "follow_up_status_id",
    title: "Estado del mantenimiento actualizado",
    description: "Se actualizó el estado del mantenimiento.",
    category: "FOLLOW_UP",
    visibility: "PUBLIC_INTERNAL",
    action: "STATUS_CHANGED",
    getValue: getFollowUpStatusValue,
  },
  {
    fieldName: "target_date",
    title: "Fecha objetivo actualizada",
    description: "Se actualizó la fecha objetivo del mantenimiento.",
    category: "FOLLOW_UP",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "due_date",
    title: "Fecha límite actualizada",
    description: "Se actualizó la fecha límite del mantenimiento.",
    category: "FOLLOW_UP",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "scheduled_date",
    title: "Fecha programada actualizada",
    description: "Se actualizó la fecha programada del mantenimiento.",
    category: "FOLLOW_UP",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "completed_at",
    title: "Fecha de finalización actualizada",
    description: "Se actualizó la fecha de finalización del mantenimiento.",
    category: "FOLLOW_UP",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "reason",
    title: "Motivo actualizado",
    description: "Se actualizó el motivo del mantenimiento.",
    category: "FOLLOW_UP",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "priority",
    title: "Prioridad actualizada",
    description: "Se actualizó la prioridad del mantenimiento.",
    category: "FOLLOW_UP",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "notes",
    title: "Notas actualizadas",
    description: "Se actualizaron las notas del mantenimiento.",
    category: "FOLLOW_UP",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "maintenance_type",
    title: "Tipo de mantenimiento actualizado",
    description: "Se actualizó el tipo de mantenimiento.",
    category: "FOLLOW_UP",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "technician_id",
    title: "Técnico asignado actualizado",
    description: "Se actualizó el técnico asignado al mantenimiento.",
    category: "FOLLOW_UP",
    visibility: "PUBLIC_INTERNAL",
    action: "UPDATED",
  },
  {
    fieldName: "estimated_amount",
    title: "Monto estimado actualizado",
    description: "Se actualizó el monto estimado del mantenimiento.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "final_amount",
    title: "Monto final actualizado",
    description: "Se actualizó el monto final del mantenimiento.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "cost_amount",
    title: "Costo actualizado",
    description: "Se actualizó el costo del mantenimiento.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "billing_status",
    title: "Estado de facturación actualizado",
    description: "Se actualizó el estado de facturación del mantenimiento.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "billing_notes",
    title: "Notas de facturación actualizadas",
    description: "Se actualizaron las notas de facturación del mantenimiento.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
  {
    fieldName: "billing_block_reason",
    title: "Motivo de bloqueo de facturación actualizado",
    description:
      "Se actualizó el motivo de bloqueo de facturación del mantenimiento.",
    category: "FINANCE",
    visibility: "FINANCE_ONLY",
    action: "UPDATED",
  },
];

const INVOICE_ACTIVITY_FIELDS: InvoiceActivityField[] = [
  {
    fieldName: "status",
    title: "Estado de factura actualizado",
    description: "Se actualizó el estado de la factura.",
    action: "STATUS_CHANGED",
  },
  {
    fieldName: "invoice_date",
    title: "Fecha de factura actualizada",
    description: "Se actualizó la fecha de la factura.",
  },
  {
    fieldName: "due_date",
    title: "Fecha de vencimiento actualizada",
    description: "Se actualizó la fecha de vencimiento de la factura.",
  },
  {
    fieldName: "payment_term",
    title: "Condición de pago actualizada",
    description: "Se actualizó la condición de pago de la factura.",
  },
  {
    fieldName: "credit_days",
    title: "Días de crédito actualizados",
    description: "Se actualizaron los días de crédito de la factura.",
  },
  {
    fieldName: "currency",
    title: "Moneda actualizada",
    description: "Se actualizó la moneda de la factura.",
  },
  {
    fieldName: "subtotal_amount",
    title: "Subtotal actualizado",
    description: "Se actualizó el subtotal de la factura.",
  },
  {
    fieldName: "discount_rate",
    title: "Porcentaje de descuento actualizado",
    description: "Se actualizó el porcentaje de descuento de la factura.",
  },
  {
    fieldName: "discount_amount",
    title: "Monto de descuento actualizado",
    description: "Se actualizó el monto de descuento de la factura.",
  },
  {
    fieldName: "discount_reason",
    title: "Motivo de descuento actualizado",
    description: "Se actualizó el motivo de descuento de la factura.",
  },
  {
    fieldName: "tax_rate",
    title: "Porcentaje de impuesto actualizado",
    description: "Se actualizó el porcentaje de impuesto de la factura.",
  },
  {
    fieldName: "tax_amount",
    title: "Monto de impuesto actualizado",
    description: "Se actualizó el monto de impuesto de la factura.",
  },
  {
    fieldName: "tax_exempt",
    title: "Exoneración de impuesto actualizada",
    description: "Se actualizó la condición de exoneración de impuesto.",
  },
  {
    fieldName: "total_amount",
    title: "Total actualizado",
    description: "Se actualizó el total de la factura.",
  },
  {
    fieldName: "paid_amount",
    title: "Monto pagado actualizado",
    description: "Se actualizó el monto pagado de la factura.",
  },
  {
    fieldName: "balance_amount",
    title: "Saldo actualizado",
    description: "Se actualizó el saldo pendiente de la factura.",
  },
  {
    fieldName: "notes",
    title: "Notas de factura actualizadas",
    description: "Se actualizaron las notas de la factura.",
  },
  {
    fieldName: "cancelled_reason",
    title: "Motivo de cancelación actualizado",
    description: "Se actualizó el motivo de cancelación de la factura.",
  },
];

function toActivityValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    const textValue = String(value).trim();
    return textValue || null;
  }

  if (typeof value === "object" && "toString" in value) {
    const textValue = String(value).trim();

    if (textValue && textValue !== "[object Object]") {
      return textValue;
    }
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeForComparison(value: unknown) {
  return toActivityValue(value) ?? "";
}

function getFollowUpStatusValue(source: ActivitySourceRecord | null) {
  if (!source) return null;

  const status = source.follow_up_status;

  if (status && typeof status === "object") {
    const statusRecord = status as Record<string, unknown>;

    return (
      statusRecord.name ??
      statusRecord.code ??
      source.follow_up_status_id ??
      null
    );
  }

  return source.follow_up_status_id ?? null;
}

function getFieldValue(
  source: ActivitySourceRecord | null,
  field: FollowUpActivityField,
) {
  if (!source) return null;

  if (field.getValue) {
    return field.getValue(source);
  }

  return source[field.fieldName] ?? null;
}

function getInvoiceFieldValue(
  source: ActivitySourceRecord | null,
  fieldName: string,
) {
  if (!source) return null;

  return source[fieldName] ?? null;
}

function getInvoiceStatusActionDetails(newStatus: string | null): {
  action: FinanceActivityAction;
  title: string;
  description: string;
} {
  if (newStatus === "CANCELLED") {
    return {
      action: "INVOICE_CANCELLED",
      title: "Factura cancelada",
      description: "Se canceló la factura.",
    };
  }

  if (newStatus === "PAID") {
    return {
      action: "INVOICE_PAID",
      title: "Factura pagada",
      description: "La factura fue pagada completamente.",
    };
  }

  if (newStatus === "OVERDUE") {
    return {
      action: "INVOICE_OVERDUE",
      title: "Factura vencida",
      description: "La factura fue marcada como vencida.",
    };
  }

  return {
    action: "STATUS_CHANGED",
    title: "Estado de factura actualizado",
    description: "Se actualizó el estado de la factura.",
  };
}

function getInvoiceLabel(invoice: ActivitySourceRecord | null) {
  const invoiceNumber = toActivityValue(invoice?.invoice_number);

  if (invoiceNumber) {
    return invoiceNumber;
  }

  return "la factura";
}

function buildInvoiceMetadata(
  invoice: ActivitySourceRecord | null,
): Prisma.InputJsonObject {
  return {
    invoice_id: toActivityValue(invoice?.invoice_id),
    invoice_number: toActivityValue(invoice?.invoice_number),
    client_id: toActivityValue(invoice?.client_id),
    installation_id: toActivityValue(invoice?.installation_id),
    follow_up_id: toActivityValue(invoice?.follow_up_id),
    source_type: toActivityValue(invoice?.source_type),
    status: toActivityValue(invoice?.status),
    payment_term: toActivityValue(invoice?.payment_term),
    currency: toActivityValue(invoice?.currency),
    subtotal_amount: toActivityValue(invoice?.subtotal_amount),
    discount_amount: toActivityValue(invoice?.discount_amount),
    tax_amount: toActivityValue(invoice?.tax_amount),
    total_amount: toActivityValue(invoice?.total_amount),
    paid_amount: toActivityValue(invoice?.paid_amount),
    balance_amount: toActivityValue(invoice?.balance_amount),
  };
}

function buildPaymentMetadata(params: {
  payment: ActivitySourceRecord | null;
  invoiceBefore?: ActivitySourceRecord | null;
  invoiceAfter?: ActivitySourceRecord | null;
}): Prisma.InputJsonObject {
  return {
    payment_id: toActivityValue(params.payment?.payment_id),
    invoice_id: toActivityValue(
      params.invoiceAfter?.invoice_id ??
        params.invoiceBefore?.invoice_id ??
        params.payment?.invoice_id,
    ),
    invoice_number: toActivityValue(
      params.invoiceAfter?.invoice_number ??
        params.invoiceBefore?.invoice_number,
    ),
    amount: toActivityValue(params.payment?.amount),
    method: toActivityValue(params.payment?.method),
    reference_number: toActivityValue(params.payment?.reference_number),
    payment_date: toActivityValue(params.payment?.payment_date),
    previous_invoice_status: toActivityValue(params.invoiceBefore?.status),
    new_invoice_status: toActivityValue(params.invoiceAfter?.status),
    previous_paid_amount: toActivityValue(params.invoiceBefore?.paid_amount),
    new_paid_amount: toActivityValue(params.invoiceAfter?.paid_amount),
    previous_balance_amount: toActivityValue(
      params.invoiceBefore?.balance_amount,
    ),
    new_balance_amount: toActivityValue(params.invoiceAfter?.balance_amount),
  };
}

export async function recordFollowUpCreatedActivitySafely(
  followUp: unknown,
  createdBy?: string | null,
) {
  try {
    const record = followUp as ActivitySourceRecord;

    const clientId = toActivityValue(record.client_id);
    const followUpId = toActivityValue(record.follow_up_id);

    if (!clientId || !followUpId) {
      return null;
    }

    return createActivityLog({
      client_id: clientId,
      entity_type: "FOLLOW_UP",
      entity_id: followUpId,
      category: "FOLLOW_UP",
      action: "CREATED",
      visibility: "PUBLIC_INTERNAL",
      title: "Mantenimiento creado",
      description: "Se creó un mantenimiento para el cliente.",
      created_by: createdBy ?? null,
    });
  } catch (error) {
    console.error("Error recording follow-up created activity:", error);
    return null;
  }
}

export async function recordFollowUpActivityChangesSafely(params: {
  before: unknown;
  after: unknown;
  changedBy?: string | null;
}) {
  try {
    return recordFollowUpActivityChanges(params);
  } catch (error) {
    console.error("Error recording follow-up activity changes:", error);
    return { count: 0 };
  }
}

async function recordFollowUpActivityChanges(params: {
  before: unknown;
  after: unknown;
  changedBy?: string | null;
}) {
  const beforeRecord = params.before as ActivitySourceRecord | null;
  const afterRecord = params.after as ActivitySourceRecord | null;

  const clientId = toActivityValue(
    afterRecord?.client_id ?? beforeRecord?.client_id,
  );

  const followUpId = toActivityValue(
    afterRecord?.follow_up_id ?? beforeRecord?.follow_up_id,
  );

  if (!clientId || !followUpId) {
    return { count: 0 };
  }

  const logs: Prisma.ActivityLogCreateManyInput[] = [];

  for (const field of FOLLOW_UP_ACTIVITY_FIELDS) {
    const oldRawValue = getFieldValue(beforeRecord, field);
    const newRawValue = getFieldValue(afterRecord, field);

    if (
      normalizeForComparison(oldRawValue) ===
      normalizeForComparison(newRawValue)
    ) {
      continue;
    }

    logs.push({
      client_id: clientId,
      entity_type: "FOLLOW_UP",
      entity_id: followUpId,
      category: field.category,
      action: field.action,
      visibility: field.visibility,
      field_name: field.fieldName,
      old_value: toActivityValue(oldRawValue),
      new_value: toActivityValue(newRawValue),
      title: field.title,
      description: field.description,
      created_by: params.changedBy ?? null,
    });
  }

  return createManyActivityLogs(logs);
}

export async function recordFinanceActivitySafely(input: FinanceActivityInput) {
  try {
    return createActivityLog({
      client_id: input.clientId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      category: "FINANCE",
      action: input.action,
      visibility: "FINANCE_ONLY",
      field_name: input.fieldName,
      old_value: input.oldValue,
      new_value: input.newValue,
      title: input.title,
      description: input.description,
      metadata: input.metadata,
      created_by: input.createdBy ?? null,
    });
  } catch (error) {
    console.error("Error recording finance activity:", error);
    return null;
  }
}

export async function recordInvoiceCreatedActivitySafely(
  invoice: unknown,
  createdBy?: string | null,
) {
  try {
    const record = invoice as ActivitySourceRecord;

    const clientId = toActivityValue(record.client_id);
    const invoiceId = toActivityValue(record.invoice_id);

    if (!clientId || !invoiceId) {
      return null;
    }

    const invoiceLabel = getInvoiceLabel(record);
    const totalAmount = toActivityValue(record.total_amount);
    const currency = toActivityValue(record.currency);

    return recordFinanceActivitySafely({
      clientId,
      entityType: "INVOICE",
      entityId: invoiceId,
      action: "INVOICE_CREATED",
      title: "Factura creada",
      description: totalAmount
        ? `Se creó la factura ${invoiceLabel} por un total de ${currency ?? ""} ${totalAmount}.`.trim()
        : `Se creó la factura ${invoiceLabel}.`,
      metadata: buildInvoiceMetadata(record),
      createdBy,
    });
  } catch (error) {
    console.error("Error recording invoice created activity:", error);
    return null;
  }
}

export async function recordInvoiceActivityChangesSafely(params: {
  before: unknown;
  after: unknown;
  changedBy?: string | null;
}) {
  try {
    return recordInvoiceActivityChanges(params);
  } catch (error) {
    console.error("Error recording invoice activity changes:", error);
    return { count: 0 };
  }
}

async function recordInvoiceActivityChanges(params: {
  before: unknown;
  after: unknown;
  changedBy?: string | null;
}) {
  const beforeRecord = params.before as ActivitySourceRecord | null;
  const afterRecord = params.after as ActivitySourceRecord | null;

  const clientId = toActivityValue(
    afterRecord?.client_id ?? beforeRecord?.client_id,
  );

  const invoiceId = toActivityValue(
    afterRecord?.invoice_id ?? beforeRecord?.invoice_id,
  );

  if (!clientId || !invoiceId) {
    return { count: 0 };
  }

  const invoiceLabel = getInvoiceLabel(afterRecord ?? beforeRecord);
  const logs: Prisma.ActivityLogCreateManyInput[] = [];

  for (const field of INVOICE_ACTIVITY_FIELDS) {
    const oldRawValue = getInvoiceFieldValue(beforeRecord, field.fieldName);
    const newRawValue = getInvoiceFieldValue(afterRecord, field.fieldName);

    if (
      normalizeForComparison(oldRawValue) ===
      normalizeForComparison(newRawValue)
    ) {
      continue;
    }

    const oldValue = toActivityValue(oldRawValue);
    const newValue = toActivityValue(newRawValue);

    let action = field.action ?? "INVOICE_UPDATED";
    let title = field.title;
    let description = field.description;

    if (field.fieldName === "status") {
      const statusDetails = getInvoiceStatusActionDetails(newValue);

      action = statusDetails.action;
      title = statusDetails.title;
      description = statusDetails.description;
    }

    logs.push({
      client_id: clientId,
      entity_type: "INVOICE",
      entity_id: invoiceId,
      category: "FINANCE",
      action,
      visibility: "FINANCE_ONLY",
      field_name: field.fieldName,
      old_value: oldValue,
      new_value: newValue,
      title,
      description: `${description} Factura: ${invoiceLabel}.`,
      metadata: buildInvoiceMetadata(afterRecord ?? beforeRecord),
      created_by: params.changedBy ?? null,
    });
  }

  return createManyActivityLogs(logs);
}

export async function recordPaymentRegisteredActivitySafely(params: {
  payment: unknown;
  invoiceBefore?: unknown;
  invoiceAfter: unknown;
  createdBy?: string | null;
}) {
  try {
    const paymentRecord = params.payment as ActivitySourceRecord | null;
    const invoiceBeforeRecord =
      params.invoiceBefore as ActivitySourceRecord | null;
    const invoiceAfterRecord =
      params.invoiceAfter as ActivitySourceRecord | null;

    const clientId = toActivityValue(
      invoiceAfterRecord?.client_id ?? invoiceBeforeRecord?.client_id,
    );

    const paymentId = toActivityValue(paymentRecord?.payment_id);
    const invoiceId = toActivityValue(
      invoiceAfterRecord?.invoice_id ??
        invoiceBeforeRecord?.invoice_id ??
        paymentRecord?.invoice_id,
    );

    if (!clientId || !paymentId || !invoiceId) {
      return { count: 0 };
    }

    const invoiceLabel = getInvoiceLabel(
      invoiceAfterRecord ?? invoiceBeforeRecord,
    );
    const paymentAmount = toActivityValue(paymentRecord?.amount);
    const currency = toActivityValue(
      invoiceAfterRecord?.currency ?? invoiceBeforeRecord?.currency,
    );

    const logs: Prisma.ActivityLogCreateManyInput[] = [
      {
        client_id: clientId,
        entity_type: "INVOICE_PAYMENT",
        entity_id: paymentId,
        category: "FINANCE",
        action: "PAYMENT_REGISTERED",
        visibility: "FINANCE_ONLY",
        title: "Pago registrado",
        description: paymentAmount
          ? `Se registró un pago de ${currency ?? ""} ${paymentAmount} para la factura ${invoiceLabel}.`.trim()
          : `Se registró un pago para la factura ${invoiceLabel}.`,
        metadata: buildPaymentMetadata({
          payment: paymentRecord,
          invoiceBefore: invoiceBeforeRecord,
          invoiceAfter: invoiceAfterRecord,
        }),
        created_by: params.createdBy ?? null,
      },
    ];

    const previousStatus = toActivityValue(invoiceBeforeRecord?.status);
    const newStatus = toActivityValue(invoiceAfterRecord?.status);

    if (newStatus === "PAID" && previousStatus !== "PAID") {
      logs.push({
        client_id: clientId,
        entity_type: "INVOICE",
        entity_id: invoiceId,
        category: "FINANCE",
        action: "INVOICE_PAID",
        visibility: "FINANCE_ONLY",
        field_name: "status",
        old_value: previousStatus,
        new_value: "PAID",
        title: "Factura pagada",
        description: `La factura ${invoiceLabel} fue pagada completamente.`,
        metadata: buildInvoiceMetadata(invoiceAfterRecord),
        created_by: params.createdBy ?? null,
      });
    }

    return createManyActivityLogs(logs);
  } catch (error) {
    console.error("Error recording payment registered activity:", error);
    return { count: 0 };
  }
}

export async function recordPaymentReversedActivitySafely(params: {
  payment: unknown;
  invoiceBefore?: unknown;
  invoiceAfter: unknown;
  createdBy?: string | null;
}) {
  try {
    const paymentRecord = params.payment as ActivitySourceRecord | null;
    const invoiceBeforeRecord =
      params.invoiceBefore as ActivitySourceRecord | null;
    const invoiceAfterRecord =
      params.invoiceAfter as ActivitySourceRecord | null;

    const clientId = toActivityValue(
      invoiceAfterRecord?.client_id ?? invoiceBeforeRecord?.client_id,
    );

    const paymentId = toActivityValue(paymentRecord?.payment_id);

    if (!clientId || !paymentId) {
      return { count: 0 };
    }

    const invoiceLabel = getInvoiceLabel(
      invoiceAfterRecord ?? invoiceBeforeRecord,
    );
    const paymentAmount = toActivityValue(paymentRecord?.amount);
    const currency = toActivityValue(
      invoiceAfterRecord?.currency ?? invoiceBeforeRecord?.currency,
    );

    return createManyActivityLogs([
      {
        client_id: clientId,
        entity_type: "INVOICE_PAYMENT",
        entity_id: paymentId,
        category: "FINANCE",
        action: "PAYMENT_REVERSED",
        visibility: "FINANCE_ONLY",
        title: "Pago revertido",
        description: paymentAmount
          ? `Se revirtió un pago de ${currency ?? ""} ${paymentAmount} asociado a la factura ${invoiceLabel}.`.trim()
          : `Se revirtió un pago asociado a la factura ${invoiceLabel}.`,
        metadata: buildPaymentMetadata({
          payment: paymentRecord,
          invoiceBefore: invoiceBeforeRecord,
          invoiceAfter: invoiceAfterRecord,
        }),
        created_by: params.createdBy ?? null,
      },
    ]);
  } catch (error) {
    console.error("Error recording payment reversed activity:", error);
    return { count: 0 };
  }
}
