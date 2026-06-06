import type { FinanceInvoice } from "../../types";
import { formatDateLabel } from "../../utils";
import {
  COLUMN_CLASSES,
  type ColumnKey,
  type PaginationState,
} from "./paymentsSectionConfig";

export function getGridTemplate(columns: ColumnKey[]) {
  return columns.map((column) => COLUMN_CLASSES[column]).join(" ");
}

export function getPaginationStartEnd(pagination: PaginationState) {
  const totalItems = pagination.totalItems;
  const pageSize = pagination.pageSize || 25;
  const currentPage = pagination.page || 1;

  return {
    start: totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1,
    end: Math.min(currentPage * pageSize, totalItems),
  };
}

export function getDueLabel(invoice: FinanceInvoice) {
  if (!invoice.due_date) return "-";

  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return `Vencido (${Math.abs(diffDays)} días)`;
  if (diffDays === 0) return "Vence hoy";
  return formatDateLabel(invoice.due_date);
}

