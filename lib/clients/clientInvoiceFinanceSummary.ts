export type ClientInvoicePayment = {
  payment_id?: string;
  invoice_payment_id?: string;
  payment_date?: string | null;
  created_at?: string | null;
  amount?: number | string | null;
  method?: string | null;
  reference_number?: string | null;
  notes?: string | null;
};

export type ClientInvoice = {
  invoice_id: string;
  invoice_number?: string | null;
  status?: string | null;
  source_type?: string | null;

  invoice_date?: string | null;
  due_date?: string | null;

  currency?: "CRC" | "USD" | string | null;

  subtotal_amount?: number | string | null;
  discount_amount?: number | string | null;
  tax_amount?: number | string | null;
  total_amount?: number | string | null;
  paid_amount?: number | string | null;
  balance_amount?: number | string | null;

  customer_snapshot_name?: string | null;
  service_snapshot_description?: string | null;
  location_snapshot?: string | null;

  installation?: {
    installation_id?: string;
    description?: string | null;
    installation_date?: string | null;
    billing_status?: string | null;
  } | null;

  follow_up?: {
    follow_up_id?: string;
    reason?: string | null;
    target_date?: string | null;
    billing_status?: string | null;
  } | null;

  payments?: ClientInvoicePayment[];
};

export type ClientInvoiceFinanceSummary = {
  invoiceCount: number;
  totalInvoiced: number;
  totalPaid: number;
  pendingBalance: number;
  overdueBalance: number;
  paidInvoiceCount: number;
  pendingInvoiceCount: number;
  overdueInvoiceCount: number;
  lastPayment: ClientInvoicePayment | null;
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateTime(value: unknown): number {
  if (!value) {
    return 0;
  }

  const parsed = new Date(String(value)).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
}

function isCancelledInvoice(invoice: ClientInvoice): boolean {
  return invoice.status === "CANCELLED";
}

export function buildClientInvoiceFinanceSummary(
  invoices: ClientInvoice[],
): ClientInvoiceFinanceSummary {
  const activeInvoices = invoices.filter(
    (invoice) => !isCancelledInvoice(invoice),
  );

  const totalInvoiced = activeInvoices.reduce(
    (total, invoice) => total + toNumber(invoice.total_amount),
    0,
  );

  const totalPaid = activeInvoices.reduce(
    (total, invoice) => total + toNumber(invoice.paid_amount),
    0,
  );

  const pendingBalance = activeInvoices.reduce(
    (total, invoice) => total + toNumber(invoice.balance_amount),
    0,
  );

  const overdueBalance = activeInvoices
    .filter((invoice) => invoice.status === "OVERDUE")
    .reduce((total, invoice) => total + toNumber(invoice.balance_amount), 0);

  const paidInvoiceCount = activeInvoices.filter(
    (invoice) => invoice.status === "PAID",
  ).length;

  const pendingInvoiceCount = activeInvoices.filter((invoice) =>
    ["PENDING", "PARTIALLY_PAID"].includes(String(invoice.status)),
  ).length;

  const overdueInvoiceCount = activeInvoices.filter(
    (invoice) => invoice.status === "OVERDUE",
  ).length;

  const payments = activeInvoices.flatMap((invoice) => invoice.payments ?? []);

  const lastPayment =
    [...payments].sort(
      (a, b) =>
        toDateTime(b.payment_date ?? b.created_at) -
        toDateTime(a.payment_date ?? a.created_at),
    )[0] ?? null;

  return {
    invoiceCount: activeInvoices.length,
    totalInvoiced,
    totalPaid,
    pendingBalance,
    overdueBalance,
    paidInvoiceCount,
    pendingInvoiceCount,
    overdueInvoiceCount,
    lastPayment,
  };
}
