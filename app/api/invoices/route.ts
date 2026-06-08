import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordInvoiceCreatedActivitySafely } from "@/lib/services/activityLogService";
import { refreshOverdueInvoices } from "@/lib/services/invoiceOverdueService";
import { validateCreateInvoiceInput } from "@/lib/validators/financeValidators";

const invoiceInclude = {
  payments: true,
  lines: true,
  client: {
    select: {
      client_id: true,
      first_name: true,
      last_name_1: true,
      last_name_2: true,
      phone_primary: true,
      email: true,
      billing_name: true,
      billing_email: true,
      billing_phone: true,
      tax_id: true,
    },
  },
  installation: {
    select: {
      installation_id: true,
      description: true,
      installation_date: true,
      billing_status: true,
    },
  },
  follow_up: {
    select: {
      follow_up_id: true,
      reason: true,
      target_date: true,
      billing_status: true,
    },
  },
} as const;

const invoiceStatusFilters = [
  "DRAFT",
  "PENDING",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;

type InvoiceStatusFilter = (typeof invoiceStatusFilters)[number];
type InvoiceSortKey =
  | "invoice"
  | "client"
  | "date"
  | "dueDate"
  | "total"
  | "paid"
  | "balance"
  | "status";

type SortDirection = "asc" | "desc";

function isInvoiceStatusFilter(
  value: string | null,
): value is InvoiceStatusFilter {
  return (
    value !== null &&
    invoiceStatusFilters.includes(value as InvoiceStatusFilter)
  );
}

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableString(value: unknown) {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();

  return text || null;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const timestamp = Date.now();

  return `INV-${year}-${timestamp}`;
}

function normalizePositiveInt(
  value: string | null,
  fallback: number,
  max: number,
) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(1, Math.floor(parsed)));
}

function parseDateOnly(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getInclusiveDateRange(
  dateFrom?: string | null,
  dateTo?: string | null,
) {
  const start = parseDateOnly(dateFrom);
  const end = parseDateOnly(dateTo);

  if (end) {
    end.setDate(end.getDate() + 1);
  }

  if (start && end) {
    return { gte: start, lt: end };
  }

  if (start) {
    return { gte: start };
  }

  if (end) {
    return { lt: end };
  }

  return null;
}

function buildInvoiceWhere(params: {
  clientId?: string | null;
  installationId?: string | null;
  followUpId?: string | null;
  status?: string | null;
  search?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  balanceDue?: boolean;
}) {
  const dueStatuses: InvoiceStatusFilter[] = [
    "PENDING",
    "PARTIALLY_PAID",
    "OVERDUE",
  ];

  const statusFilter =
    params.status &&
    params.status !== "ALL" &&
    isInvoiceStatusFilter(params.status)
      ? params.status
      : undefined;

  const search = params.search?.trim();
  const dateRange = getInclusiveDateRange(params.dateFrom, params.dateTo);

  const where: Prisma.InvoiceWhereInput = {
    ...(params.clientId ? { client_id: params.clientId } : {}),
    ...(params.installationId
      ? { installation_id: params.installationId }
      : {}),
    ...(params.followUpId ? { follow_up_id: params.followUpId } : {}),
    ...(params.balanceDue
      ? {
          balance_amount: { gt: 0 },
          status:
            statusFilter && dueStatuses.includes(statusFilter)
              ? statusFilter
              : { in: dueStatuses },
        }
      : statusFilter
        ? { status: statusFilter }
        : {}),
    ...(dateRange ? { invoice_date: dateRange } : {}),
  };

  if (search) {
    where.OR = [
      { invoice_number: { contains: search, mode: "insensitive" } },
      { customer_snapshot_name: { contains: search, mode: "insensitive" } },
      { customer_snapshot_phone: { contains: search } },
      {
        service_snapshot_description: { contains: search, mode: "insensitive" },
      },
      { client: { first_name: { contains: search, mode: "insensitive" } } },
      { client: { last_name_1: { contains: search, mode: "insensitive" } } },
      { client: { last_name_2: { contains: search, mode: "insensitive" } } },
      { client: { phone_primary: { contains: search } } },
      { client: { email: { contains: search, mode: "insensitive" } } },
      { client: { billing_name: { contains: search, mode: "insensitive" } } },
      { client: { billing_email: { contains: search, mode: "insensitive" } } },
      { client: { billing_phone: { contains: search } } },
      { client: { tax_id: { contains: search } } },
    ];
  }

  return where;
}

function buildInvoiceOrderBy(
  sortKey: InvoiceSortKey = "date",
  sortDirection: SortDirection = "desc",
): Prisma.InvoiceOrderByWithRelationInput[] {
  const direction = sortDirection === "asc" ? "asc" : "desc";

  if (sortKey === "invoice") {
    return [{ invoice_number: direction }, { invoice_date: "desc" }];
  }

  if (sortKey === "client") {
    return [
      { customer_snapshot_name: direction },
      { client: { first_name: direction } },
      { invoice_date: "desc" },
    ];
  }

  if (sortKey === "dueDate") {
    return [{ due_date: direction }, { invoice_date: "desc" }];
  }

  if (sortKey === "total") {
    return [{ total_amount: direction }, { invoice_date: "desc" }];
  }

  if (sortKey === "paid") {
    return [{ paid_amount: direction }, { invoice_date: "desc" }];
  }

  if (sortKey === "balance") {
    return [{ balance_amount: direction }, { invoice_date: "desc" }];
  }

  if (sortKey === "status") {
    return [{ status: direction }, { invoice_date: "desc" }];
  }

  return [{ invoice_date: direction }];
}

function sumInvoices<
  T extends {
    total_amount: unknown;
    paid_amount: unknown;
    balance_amount: unknown;
    status: unknown;
  },
>(invoices: T[]) {
  return invoices.reduce(
    (summary, invoice) => {
      const status = String(invoice.status ?? "");
      const totalAmount = toNumber(invoice.total_amount, 0);
      const paidAmount = toNumber(invoice.paid_amount, 0);
      const balanceAmount = toNumber(invoice.balance_amount, 0);

      if (status !== "CANCELLED") {
        summary.totalInvoiced += totalAmount;
      }

      if (
        status === "PENDING" ||
        status === "PARTIALLY_PAID" ||
        status === "OVERDUE"
      ) {
        summary.pendingAmount += balanceAmount;
      }

      if (status === "OVERDUE") {
        summary.overdueAmount += balanceAmount;
        summary.overdueCount += 1;
      }

      if (status === "CANCELLED") {
        summary.cancelledAmount += totalAmount;
      }

      summary.paidAmount += paidAmount;

      return summary;
    },
    {
      totalInvoiced: 0,
      pendingAmount: 0,
      paidAmount: 0,
      overdueAmount: 0,
      cancelledAmount: 0,
      overdueCount: 0,
    },
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const clientId = searchParams.get("client_id");
    const installationId = searchParams.get("installation_id");
    const followUpId = searchParams.get("follow_up_id");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || null;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const balanceDue = searchParams.get("balanceDue") === "true";
    const page = normalizePositiveInt(searchParams.get("page"), 1, 100000);
    const pageSize = normalizePositiveInt(
      searchParams.get("pageSize"),
      15,
      100,
    );
    const sortKey = (searchParams.get("sortKey") || "date") as InvoiceSortKey;
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";
    const skip = (page - 1) * pageSize;

    const baseParams = {
      clientId,
      installationId,
      followUpId,
      search,
      dateFrom,
      dateTo,
      balanceDue,
    };

    const where = buildInvoiceWhere({ ...baseParams, status });
    const metricsWhere = buildInvoiceWhere({ ...baseParams, status: null });

    await refreshOverdueInvoices();

    const [invoices, totalItems, metricInvoices] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: invoiceInclude,
        orderBy: buildInvoiceOrderBy(sortKey, sortDirection),
        skip,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where: metricsWhere,
        select: {
          status: true,
          total_amount: true,
          paid_amount: true,
          balance_amount: true,
        },
      }),
    ]);

    const metrics = sumInvoices(metricInvoices);

    return NextResponse.json(
      {
        success: true,
        data: invoices,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
        },
        metrics,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/invoices error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const validationResult = validateCreateInvoiceInput(await req.json());

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: validationResult.message,
        },
        { status: 400 },
      );
    }

    const body = validationResult.data;
    const sourceType = body.source_type;

    const client = await prisma.client.findUnique({
      where: {
        client_id: body.client_id,
      },
    });

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          message: "Client not found",
        },
        { status: 404 },
      );
    }

    if (body.installation_id) {
      const existingInstallationInvoice = await prisma.invoice.findFirst({
        where: {
          installation_id: body.installation_id,
          status: {
            not: "CANCELLED",
          },
        },
      });

      if (existingInstallationInvoice) {
        return NextResponse.json(
          {
            success: false,
            message: "An active invoice already exists for this installation",
          },
          { status: 400 },
        );
      }
    }

    if (body.follow_up_id) {
      const existingFollowUpInvoice = await prisma.invoice.findFirst({
        where: {
          follow_up_id: body.follow_up_id,
          status: {
            not: "CANCELLED",
          },
        },
      });

      if (existingFollowUpInvoice) {
        return NextResponse.json(
          {
            success: false,
            message: "An active invoice already exists for this follow-up",
          },
          { status: 400 },
        );
      }
    }

    const quantity = body.quantity;
    const unitPrice = body.unit_price;
    const subtotalAmount = quantity * unitPrice;

    if (subtotalAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice amount must be greater than zero",
        },
        { status: 400 },
      );
    }

    const discountRate = body.discount_rate;
    const discountAmount = subtotalAmount * (discountRate / 100);

    const taxableAmount = subtotalAmount - discountAmount;
    const taxExempt = body.tax_exempt;
    const taxRate = taxExempt ? 0 : (body.tax_rate ?? 13);
    const taxAmount = taxExempt ? 0 : taxableAmount * (taxRate / 100);

    const totalAmount = taxableAmount + taxAmount;

    const paymentTerm =
      body.payment_term ?? client.default_payment_term ?? "CASH";

    const creditDays =
      paymentTerm === "CREDIT"
        ? toNumber(body.credit_days ?? client.default_credit_days, 0)
        : null;

    const invoiceDate = new Date();
    const dueDate =
      paymentTerm === "CREDIT" && creditDays && creditDays > 0
        ? addDays(invoiceDate, creditDays)
        : null;

    const customerSnapshotName =
      body.customer_snapshot_name ||
      client.billing_name ||
      [client.first_name, client.last_name_1, client.last_name_2]
        .filter(Boolean)
        .join(" ");

    const customerSnapshotPhone =
      body.customer_snapshot_phone ||
      client.billing_phone ||
      client.phone_primary ||
      null;

    const serviceSnapshotDescription =
      body.service_snapshot_description ||
      body.description ||
      "Servicio realizado";

    const invoice = await prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.invoice.create({
        data: {
          invoice_number: generateInvoiceNumber(),

          client_id: client.client_id,
          installation_id:
            sourceType === "INSTALLATION"
              ? (body.installation_id ?? null)
              : null,
          follow_up_id:
            sourceType === "FOLLOW_UP" ? (body.follow_up_id ?? null) : null,

          source_type: sourceType,
          status: "PENDING",

          invoice_date: invoiceDate,
          due_date: dueDate,

          payment_term: paymentTerm,
          credit_days: creditDays,

          currency: body.currency ?? client.preferred_currency ?? "CRC",

          subtotal_amount: subtotalAmount,

          discount_rate: discountRate,
          discount_amount: discountAmount,
          discount_reason: toNullableString(body.discount_reason),

          tax_rate: taxRate,
          tax_amount: taxAmount,
          tax_exempt: taxExempt,

          total_amount: totalAmount,

          paid_amount: 0,
          balance_amount: totalAmount,

          customer_snapshot_name: customerSnapshotName,
          customer_snapshot_phone: customerSnapshotPhone,
          service_snapshot_description: serviceSnapshotDescription,
          location_snapshot: toNullableString(body.location_snapshot),

          notes: toNullableString(body.notes),

          lines: {
            create: [
              {
                description:
                  toNullableString(body.description) ||
                  serviceSnapshotDescription ||
                  "Servicio realizado",
                quantity,
                unit_price: unitPrice,
                total: subtotalAmount,
              },
            ],
          },
        },
        include: invoiceInclude,
      });

      if (sourceType === "INSTALLATION" && body.installation_id) {
        await tx.installation.update({
          where: {
            installation_id: body.installation_id,
          },
          data: {
            billing_status: "INVOICED",
          },
        });
      }

      if (sourceType === "FOLLOW_UP" && body.follow_up_id) {
        await tx.followUp.update({
          where: {
            follow_up_id: body.follow_up_id,
          },
          data: {
            billing_status: "INVOICED",
          },
        });
      }

      return createdInvoice;
    });

    await recordInvoiceCreatedActivitySafely(invoice, body.created_by ?? null);

    return NextResponse.json(
      {
        success: true,
        data: invoice,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/invoices error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create invoice",
      },
      { status: 500 },
    );
  }
}
