type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

export const createInvoiceSchema = {
  sourceTypes: ["INSTALLATION", "FOLLOW_UP", "MANUAL"] as const,
  paymentTerms: ["CASH", "CREDIT"] as const,
};

export const registerPaymentSchema = {
  methods: ["CASH", "SINPE", "BANK_TRANSFER", "CARD", "OTHER"] as const,
};

export type SourceType = (typeof createInvoiceSchema.sourceTypes)[number];
export type PaymentTerm = (typeof createInvoiceSchema.paymentTerms)[number];
export type Currency = string;
export type PaymentMethod = (typeof registerPaymentSchema.methods)[number];

export type CreateInvoiceInput = {
  client_id: string;
  source_type: SourceType;
  installation_id: string | null;
  follow_up_id: string | null;
  payment_term?: PaymentTerm;
  credit_days?: number | null;
  currency?: Currency;
  description?: string | null;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  discount_reason?: string | null;
  tax_rate?: number;
  tax_exempt: boolean;
  customer_snapshot_name?: string | null;
  customer_snapshot_phone?: string | null;
  service_snapshot_description?: string | null;
  location_snapshot?: string | null;
  notes?: string | null;
  created_by?: string | null;
};

export type RegisterPaymentInput = {
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  reference_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function trimToNull(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text === "" ? null : text;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidStringUnion<T extends string>(
  value: unknown,
  values: readonly T[],
): value is T {
  return isString(value) && values.includes(value as T);
}

function isIsoCurrencyCode(value: unknown): value is string {
  return isString(value) && /^[A-Z]{3}$/.test(value);
}

export function validateCreateInvoiceInput(
  body: unknown,
): ValidationResult<CreateInvoiceInput> {
  if (!isObject(body)) {
    return { success: false, message: "Invalid request payload" };
  }

  const client_id = trimToNull(body.client_id);
  if (!client_id) {
    return { success: false, message: "client_id is required" };
  }

  const rawSourceType = body.source_type ?? "MANUAL";
  if (!isValidStringUnion(rawSourceType, createInvoiceSchema.sourceTypes)) {
    return {
      success: false,
      message: "source_type must be INSTALLATION, FOLLOW_UP, or MANUAL",
    };
  }

  const source_type = rawSourceType;
  const installation_id = trimToNull(body.installation_id);
  const follow_up_id = trimToNull(body.follow_up_id);

  if (source_type === "INSTALLATION" && !installation_id) {
    return {
      success: false,
      message: "installation_id is required for installation invoices",
    };
  }

  if (source_type === "FOLLOW_UP" && !follow_up_id) {
    return {
      success: false,
      message: "follow_up_id is required for follow up invoices",
    };
  }

  const payment_termRaw = body.payment_term;
  if (
    payment_termRaw !== undefined &&
    !isValidStringUnion(payment_termRaw, createInvoiceSchema.paymentTerms)
  ) {
    return {
      success: false,
      message: "payment_term must be CASH or CREDIT",
    };
  }

  const currencyRaw = body.currency;
  if (currencyRaw !== undefined && !isIsoCurrencyCode(currencyRaw)) {
    return {
      success: false,
      message: "currency must be a 3-letter uppercase ISO code",
    };
  }

  const quantityRaw = body.quantity;
  const quantityParsed = parseNumber(quantityRaw);
  const quantity =
    quantityRaw === undefined || quantityRaw === null || quantityRaw === ""
      ? 1
      : quantityParsed;
  if (quantity === null || quantity <= 0) {
    return {
      success: false,
      message: "quantity must be greater than zero",
    };
  }

  const unit_price = parseNumber(body.unit_price);
  if (unit_price === null || unit_price <= 0) {
    return {
      success: false,
      message: "unit_price must be greater than zero",
    };
  }

  const discount_rate = parseNumber(body.discount_rate);
  if (discount_rate !== null && (discount_rate < 0 || discount_rate > 100)) {
    return {
      success: false,
      message: "discount_rate must be between 0 and 100",
    };
  }

  const tax_exempt = Boolean(body.tax_exempt);
  const tax_rate = parseNumber(body.tax_rate);
  if (!tax_exempt && tax_rate !== null && (tax_rate < 0 || tax_rate > 100)) {
    return {
      success: false,
      message: "tax_rate must be between 0 and 100",
    };
  }

  const credit_daysRaw = body.credit_days;
  const credit_days = parseNumber(credit_daysRaw);
  if (
    payment_termRaw === "CREDIT" &&
    credit_daysRaw !== undefined &&
    credit_days === null
  ) {
    return {
      success: false,
      message: "credit_days must be a valid number",
    };
  }

  return {
    success: true,
    data: {
      client_id,
      source_type,
      installation_id: source_type === "INSTALLATION" ? installation_id : null,
      follow_up_id: source_type === "FOLLOW_UP" ? follow_up_id : null,
      payment_term: payment_termRaw as PaymentTerm | undefined,
      credit_days: credit_daysRaw === undefined ? null : credit_days,
      currency: currencyRaw as Currency | undefined,
      description: trimToNull(body.description),
      quantity,
      unit_price,
      discount_rate: discount_rate === null ? 0 : discount_rate,
      discount_reason: trimToNull(body.discount_reason),
      tax_rate: tax_rate === null ? undefined : tax_rate,
      tax_exempt,
      customer_snapshot_name: trimToNull(body.customer_snapshot_name),
      customer_snapshot_phone: trimToNull(body.customer_snapshot_phone),
      service_snapshot_description: trimToNull(
        body.service_snapshot_description,
      ),
      location_snapshot: trimToNull(body.location_snapshot),
      notes: trimToNull(body.notes),
      created_by: trimToNull(body.created_by),
    },
  };
}

export function validateRegisterPaymentInput(
  body: unknown,
): ValidationResult<RegisterPaymentInput> {
  if (!isObject(body)) {
    return { success: false, message: "Invalid request payload" };
  }

  const invoice_id = trimToNull(body.invoice_id);
  if (!invoice_id) {
    return {
      success: false,
      message: "invoice_id is required",
    };
  }

  const amount = parseNumber(body.amount);
  if (amount === null || amount <= 0) {
    return {
      success: false,
      message: "amount must be greater than zero",
    };
  }

  const method = body.method;
  if (!isValidStringUnion(method, registerPaymentSchema.methods)) {
    return {
      success: false,
      message:
        "method must be one of CASH, SINPE, BANK_TRANSFER, CARD, or OTHER",
    };
  }

  return {
    success: true,
    data: {
      invoice_id,
      amount,
      method,
      reference_number: trimToNull(body.reference_number),
      notes: trimToNull(body.notes),
      created_by: trimToNull(body.created_by),
    },
  };
}
