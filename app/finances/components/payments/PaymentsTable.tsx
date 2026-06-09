import type { FinanceInvoice } from "../../types";
import {
  formatCurrency,
  formatDateLabel,
  getClientName,
  getInvoiceCurrency,
  getInvoiceOrigin,
  getInvoiceStatusClass,
  getInvoiceStatusLabel,
} from "../../utils";
import {
  COLUMN_LABELS,
  type ColumnKey,
  type PaymentSortKey,
  type SortDirection,
} from "./paymentsSectionConfig";
import { getDueLabel } from "./paymentsSectionUtils";
import { SortableHeader } from "./SortableHeader";

type PaymentsTableProps = {
  invoices: FinanceInvoice[];
  displayedColumns: ColumnKey[];
  gridTemplateColumns: string;
  sortKey: PaymentSortKey;
  sortDirection: SortDirection;
  onSortChange: (key: PaymentSortKey) => void;
  onSelectInvoice: (invoice: FinanceInvoice) => void;
};

export function PaymentsTable({
  invoices,
  displayedColumns,
  gridTemplateColumns,
  sortKey,
  sortDirection,
  onSortChange,
  onSelectInvoice,
}: PaymentsTableProps) {
  return (
    <section className="mt-5 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[1080px]">
          <div
            style={{ gridTemplateColumns }}
            className="grid border-b border-slate-200 bg-slate-50"
          >
            {displayedColumns.map((column) => (
              <SortableHeader
                key={column}
                columnKey={column}
                label={COLUMN_LABELS[column]}
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                align={
                  column === "total" ||
                  column === "paid" ||
                  column === "balance"
                    ? "right"
                    : column === "status" || column === "action"
                      ? "center"
                      : "left"
                }
                onSortChange={onSortChange}
              />
            ))}
          </div>

          <ul className="divide-y divide-slate-100">
            {invoices.map((invoice) => {
              const invoiceCurrency = getInvoiceCurrency(invoice);
              const clientName =
                invoice.customer_snapshot_name ||
                getClientName(invoice.client) ||
                "-";

              return (
                <li
                  key={invoice.invoice_id}
                  style={{ gridTemplateColumns }}
                  className="grid min-h-[58px] bg-white transition hover:bg-slate-50"
                >
                  {displayedColumns.map((column) => {
                    if (column === "invoice") {
                      return (
                        <div
                          key={column}
                          className="min-w-0 border-r border-slate-100 px-3 py-2"
                        >
                          <p
                            title={invoice.invoice_number || "Sin número"}
                            className="truncate text-sm font-semibold text-slate-950"
                          >
                            {invoice.invoice_number || "Sin número"}
                          </p>
                          <p
                            title={getInvoiceOrigin(invoice)}
                            className="mt-1 truncate text-xs font-medium text-slate-500"
                          >
                            {getInvoiceOrigin(invoice)}
                          </p>
                        </div>
                      );
                    }

                    if (column === "client") {
                      return (
                        <div
                          key={column}
                          className="min-w-0 border-r border-slate-100 px-3 py-2"
                        >
                          <p
                            title={clientName}
                            className="truncate text-sm font-semibold text-slate-900"
                          >
                            {clientName}
                          </p>
                          <p
                            title={
                              invoice.customer_snapshot_phone ||
                              invoice.client?.phone_primary ||
                              ""
                            }
                            className="mt-1 truncate text-xs font-medium text-slate-500"
                          >
                            {invoice.customer_snapshot_phone ||
                              invoice.client?.phone_primary ||
                              "Sin teléfono"}
                          </p>
                        </div>
                      );
                    }

                    if (column === "date") {
                      return (
                        <div
                          key={column}
                          className="flex min-w-0 items-center border-r border-slate-100 px-3 py-2"
                        >
                          <span className="truncate text-sm font-medium text-slate-700">
                            {formatDateLabel(invoice.invoice_date)}
                          </span>
                        </div>
                      );
                    }

                    if (column === "dueDate") {
                      const dueLabel = getDueLabel(invoice);

                      return (
                        <div
                          key={column}
                          className="flex min-w-0 items-center border-r border-slate-100 px-3 py-2"
                        >
                          <span
                            title={dueLabel}
                            className={`truncate text-sm font-semibold ${
                              invoice.status === "OVERDUE"
                                ? "text-red-700"
                                : "text-slate-700"
                            }`}
                          >
                            {dueLabel}
                          </span>
                        </div>
                      );
                    }

                    if (column === "total") {
                      return (
                        <div
                          key={column}
                          className="flex min-w-0 items-center justify-end border-r border-slate-100 px-3 py-2"
                        >
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {formatCurrency(
                              invoice.total_amount,
                              invoiceCurrency,
                            )}
                          </span>
                        </div>
                      );
                    }

                    if (column === "paid") {
                      return (
                        <div
                          key={column}
                          className="flex min-w-0 items-center justify-end border-r border-slate-100 px-3 py-2"
                        >
                          <span className="truncate text-sm font-semibold text-slate-800">
                            {formatCurrency(
                              invoice.paid_amount,
                              invoiceCurrency,
                            )}
                          </span>
                        </div>
                      );
                    }

                    if (column === "balance") {
                      return (
                        <div
                          key={column}
                          className="flex min-w-0 items-center justify-end border-r border-slate-100 px-3 py-2"
                        >
                          <span className="truncate text-sm font-semibold text-slate-950">
                            {formatCurrency(
                              invoice.balance_amount,
                              invoiceCurrency,
                            )}
                          </span>
                        </div>
                      );
                    }

                    if (column === "status") {
                      return (
                        <div
                          key={column}
                          className="flex min-w-0 items-center justify-center border-r border-slate-100 px-3 py-2"
                        >
                          <span
                            className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${getInvoiceStatusClass(
                              invoice.status,
                            )}`}
                          >
                            {getInvoiceStatusLabel(invoice.status)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={column}
                        className="flex min-w-0 items-center justify-center px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectInvoice(invoice)}
                          className="inline-flex min-w-[118px] items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Registrar pago
                        </button>
                      </div>
                    );
                  })}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
