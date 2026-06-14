import { CLIENT_COLUMNS } from "../config/reportBuilderConfig";
import type { ClientColumnKey, ReportRow } from "../types";

export function getColumnLabel(columnKey: string) {
  return (
    CLIENT_COLUMNS.find((column) => column.key === columnKey)?.label ||
    columnKey
  );
}

export function formatCellValue(columnKey: string, value: string | number) {
  if (columnKey === "pending_billing") {
    const numberValue = Number(value || 0);

    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(numberValue) ? numberValue : 0);
  }

  if (columnKey === "created_at" || columnKey === "updated_at") {
    if (!value) return "-";

    try {
      return new Intl.DateTimeFormat("es-CR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(String(value)));
    } catch {
      return String(value);
    }
  }

  return String(value ?? "");
}

export function formatExcelValue(columnKey: string, value: string | number) {
  if (columnKey === "pending_billing") {
    const numberValue = Number(value || 0);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  return formatCellValue(columnKey, value);
}

export function buildReportMatrix(
  columns: ClientColumnKey[],
  rows: ReportRow[],
) {
  const headers = columns.map((columnKey) => getColumnLabel(columnKey));

  const body = rows.map((row) =>
    columns.map((columnKey) =>
      formatExcelValue(columnKey, row[columnKey] ?? ""),
    ),
  );

  return [headers, ...body];
}
