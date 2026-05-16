export const financeMenu = [
  "Facturas",
  "Nueva factura",
  "Buscar facturas",
  "Trabajos pendientes para facturar",
  "Pagos",
  "Clientes con crédito",
  "Reportes / ingresos",
] as const;

export type FinanceMenuItem = (typeof financeMenu)[number];

export type FinanceInvoice = {
  invoice_id: string;
  invoice_number?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  status?: string | null;
  total_amount?: number | string | null;
  paid_amount?: number | string | null;
  balance_amount?: number | string | null;
  subtotal_amount?: number | string | null;
  discount_rate?: number | string | null;
  discount_amount?: number | string | null;
  discount_reason?: string | null;
  tax_rate?: number | string | null;
  tax_amount?: number | string | null;
  tax_exempt?: boolean | null;
  payment_term?: string | null;
  credit_days?: number | null;
  currency?: string | null;
  notes?: string | null;
  customer_snapshot_name?: string | null;
  customer_snapshot_phone?: string | null;
  service_snapshot_description?: string | null;
  location_snapshot?: string | null;
  client?: {
    client_id: string;
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
    phone_primary?: string | null;
    email?: string | null;
    billing_name?: string | null;
    billing_email?: string | null;
    billing_phone?: string | null;
    tax_id?: string | null;
  } | null;
  installation?: {
    installation_id: string;
    description?: string | null;
    installation_date?: string | null;
    billing_status?: string | null;
  } | null;
  follow_up?: {
    follow_up_id: string;
    reason?: string | null;
    target_date?: string | null;
    billing_status?: string | null;
  } | null;
  lines?: Array<{
    invoice_line_id: string;
    description?: string | null;
    quantity?: number | string | null;
    unit_price?: number | string | null;
    total?: number | string | null;
  }> | null;
  payments?: Array<{
    payment_id: string;
    payment_date?: string | null;
    amount?: number | string | null;
    method?: string | null;
    reference_number?: string | null;
    notes?: string | null;
  }> | null;
};

export type PendingBillable = {
  id: string;
  type: "INSTALLATION" | "FOLLOW_UP";
  client_id: string;
  installation_id?: string | null;
  follow_up_id?: string | null;
  client?: {
    client_id: string;
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
    phone_primary?: string | null;
    email?: string | null;
    billing_name?: string | null;
    billing_email?: string | null;
    billing_phone?: string | null;
    billing_address?: string | null;
    tax_id?: string | null;
    default_payment_term?: "CASH" | "CREDIT" | null;
    default_credit_days?: number | null;
    default_discount_rate?: number | string | null;
    tax_exempt?: boolean | null;
  } | null;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  description?: string | null;
  date?: string | null;
  estimated_amount?: number | string | null;
  final_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  source_label?: string | null;
  status_label?: string | null;
};

export type PendingBillablesResponse = {
  summary?: {
    count: number;
    total_amount: number;
    total_cost: number;
    estimated_profit: number;
  };
  items?: PendingBillable[];
};
