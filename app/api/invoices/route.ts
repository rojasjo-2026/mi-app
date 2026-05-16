import { NextResponse } from "next/server";
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const clientId = searchParams.get("client_id");
    const installationId = searchParams.get("installation_id");
    const followUpId = searchParams.get("follow_up_id");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const statusFilter =
      status && status !== "ALL" && isInvoiceStatusFilter(status)
        ? status
        : undefined;

    await refreshOverdueInvoices();

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(clientId ? { client_id: clientId } : {}),
        ...(installationId ? { installation_id: installationId } : {}),
        ...(followUpId ? { follow_up_id: followUpId } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search
          ? {
              OR: [
                {
                  invoice_number: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  customer_snapshot_name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  customer_snapshot_phone: {
                    contains: search,
                  },
                },
                {
                  service_snapshot_description: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  client: {
                    first_name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  client: {
                    last_name_1: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  client: {
                    last_name_2: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  client: {
                    phone_primary: {
                      contains: search,
                    },
                  },
                },
                {
                  client: {
                    email: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  client: {
                    billing_name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  client: {
                    billing_email: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  client: {
                    billing_phone: {
                      contains: search,
                    },
                  },
                },
                {
                  client: {
                    tax_id: {
                      contains: search,
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: invoiceInclude,
      orderBy: {
        invoice_date: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: invoices,
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
