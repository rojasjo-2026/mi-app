import { REPORT_COLUMNS_BY_SOURCE } from "../config/reportBuilderConfig";
import type { ReportColumnKey, ReportRow, ReportSource } from "../types";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  PROSPECT: "Prospecto",
  ON_HOLD: "En espera",
  INACTIVE: "Inactivo",

  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",

  PENDING: "Pendiente",
  INVOICED: "Facturada",
  PARTIALLY_PAID: "Parcialmente pagada",
  PAID: "Pagada",
  NOT_BILLABLE: "No facturable",
  BILLING_ERROR: "Error de facturación",

  PERSON: "Persona",
  COMPANY: "Empresa",
  OTHER: "Otro",

  CASH: "Contado",
  CREDIT: "Crédito",
};

const MONEY_COLUMNS = new Set([
  "pending_billing",
  "estimated_amount",
  "final_amount",
  "cost_amount",
]);

const DATE_COLUMNS = new Set([
  "created_at",
  "updated_at",
  "installation_date",
  "warranty_end_date",
  "pending_follow_up_date",
]);

export function getColumnLabel(
  source: ReportSource,
  columnKey: ReportColumnKey,
) {
  return (
    REPORT_COLUMNS_BY_SOURCE[source].find((column) => column.key === columnKey)
      ?.label || columnKey
  );
}

export function formatCellValue(columnKey: string, value: string | number) {
  if (MONEY_COLUMNS.has(columnKey)) {
    const numberValue = Number(value || 0);

    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(numberValue) ? numberValue : 0);
  }

  if (DATE_COLUMNS.has(columnKey)) {
    if (!value) return "-";

    try {
      return new Intl.DateTimeFormat("es-CR", {
        dateStyle: "medium",
      }).format(new Date(String(value)));
    } catch {
      return String(value);
    }
  }

  const rawValue = String(value ?? "");

  return STATUS_LABELS[rawValue] ?? rawValue;
}

export function formatExcelValue(columnKey: string, value: string | number) {
  if (MONEY_COLUMNS.has(columnKey)) {
    const numberValue = Number(value || 0);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  return formatCellValue(columnKey, value);
}

export function buildReportMatrix(
  source: ReportSource,
  columns: ReportColumnKey[],
  rows: ReportRow[],
) {
  const headers = columns.map((columnKey) => getColumnLabel(source, columnKey));

  const body = rows.map((row) =>
    columns.map((columnKey) =>
      formatExcelValue(columnKey, row[columnKey] ?? ""),
    ),
  );

  return [headers, ...body];
}
