import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshOverdueInvoices } from "@/lib/services/invoiceOverdueService";

const pendingInvoiceStatuses = [
  "PENDING",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function buildClientName(client?: {
  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
  billing_name?: string | null;
}) {
  if (!client) return "-";

  return (
    client.billing_name ||
    [client.first_name, client.last_name_1, client.last_name_2]
      .filter(Boolean)
      .join(" ")
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();

    await refreshOverdueInvoices();

    const searchFilter = search
      ? {
          OR: [
            { first_name: { contains: search, mode: "insensitive" as const } },
            { last_name_1: { contains: search, mode: "insensitive" as const } },
            { last_name_2: { contains: search, mode: "insensitive" as const } },
            { phone_primary: { contains: search } },
            { email: { contains: search, mode: "insensitive" as const } },
            {
              billing_name: { contains: search, mode: "insensitive" as const },
            },
            {
              billing_email: { contains: search, mode: "insensitive" as const },
            },
            { billing_phone: { contains: search } },
            { tax_id: { contains: search } },
          ],
        }
      : {};

    const creditClients = await prisma.client.findMany({
      where: {
        default_payment_term: "CREDIT",
        ...searchFilter,
      },
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
        default_payment_term: true,
        default_credit_days: true,
        credit_limit: true,
        invoices: {
          where: {
            status: {
              in: [...pendingInvoiceStatuses],
            },
            balance_amount: {
              gt: 0,
            },
          },
          select: {
            invoice_id: true,
            invoice_number: true,
            status: true,
            invoice_date: true,
            due_date: true,
            total_amount: true,
            paid_amount: true,
            balance_amount: true,
          },
          orderBy: {
            due_date: "asc",
          },
        },
      },
      orderBy: {
        first_name: "asc",
      },
    });

    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: [...pendingInvoiceStatuses],
        },
        balance_amount: {
          gt: 0,
        },
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
                  client: searchFilter,
                },
              ],
            }
          : {}),
      },
      select: {
        invoice_id: true,
        invoice_number: true,
        status: true,
        invoice_date: true,
        due_date: true,
        total_amount: true,
        paid_amount: true,
        balance_amount: true,
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
            default_payment_term: true,
            default_credit_days: true,
            credit_limit: true,
          },
        },
      },
      orderBy: {
        due_date: "asc",
      },
    });

    const clientsMap = new Map<string, any>();

    for (const client of creditClients) {
      clientsMap.set(client.client_id, {
        client_id: client.client_id,
        client_name: buildClientName(client),
        phone: client.billing_phone || client.phone_primary || null,
        email: client.billing_email || client.email || null,
        tax_id: client.tax_id,
        default_payment_term: client.default_payment_term,
        default_credit_days: client.default_credit_days,
        credit_limit: toNumber(client.credit_limit),
        has_credit_terms: true,
        invoices: client.invoices.map((invoice) => ({
          invoice_id: invoice.invoice_id,
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          total_amount: toNumber(invoice.total_amount),
          paid_amount: toNumber(invoice.paid_amount),
          balance_amount: toNumber(invoice.balance_amount),
        })),
      });
    }

    for (const invoice of pendingInvoices) {
      const client = invoice.client;

      if (!clientsMap.has(client.client_id)) {
        clientsMap.set(client.client_id, {
          client_id: client.client_id,
          client_name: buildClientName(client),
          phone: client.billing_phone || client.phone_primary || null,
          email: client.billing_email || client.email || null,
          tax_id: client.tax_id,
          default_payment_term: client.default_payment_term,
          default_credit_days: client.default_credit_days,
          credit_limit: toNumber(client.credit_limit),
          has_credit_terms: client.default_payment_term === "CREDIT",
          invoices: [],
        });
      }

      clientsMap.get(client.client_id).invoices.push({
        invoice_id: invoice.invoice_id,
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        total_amount: toNumber(invoice.total_amount),
        paid_amount: toNumber(invoice.paid_amount),
        balance_amount: toNumber(invoice.balance_amount),
      });
    }

    const items = Array.from(clientsMap.values()).map((item) => {
      const pending_amount = item.invoices.reduce(
        (total: number, invoice: any) =>
          total + toNumber(invoice.balance_amount),
        0,
      );

      const overdue_amount = item.invoices
        .filter((invoice: any) => invoice.status === "OVERDUE")
        .reduce(
          (total: number, invoice: any) =>
            total + toNumber(invoice.balance_amount),
          0,
        );

      return {
        ...item,
        invoice_count: item.invoices.length,
        pending_amount,
        overdue_amount,
      };
    });

    const sortedItems = items.sort(
      (a, b) => b.pending_amount - a.pending_amount,
    );

    const totalPending = sortedItems.reduce(
      (total, item) => total + item.pending_amount,
      0,
    );

    const totalOverdue = sortedItems.reduce(
      (total, item) => total + item.overdue_amount,
      0,
    );

    const creditClientsCount = sortedItems.filter(
      (item) => item.has_credit_terms,
    ).length;

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            count: sortedItems.length,
            credit_clients_count: creditClientsCount,
            total_pending: totalPending,
            total_overdue: totalOverdue,
          },
          items: sortedItems,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/finance/credit-clients error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load credit clients",
      },
      { status: 500 },
    );
  }
}
