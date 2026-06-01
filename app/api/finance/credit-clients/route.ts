import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { refreshOverdueInvoices } from "@/lib/services/invoiceOverdueService";

const pendingInvoiceStatuses = [
  "PENDING",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;

type CreditClientScope = "ALL" | "WITH_BALANCE" | "OVERDUE" | "CREDIT_ONLY";
type CreditClientSortKey =
  | "client"
  | "pending"
  | "overdue"
  | "creditLimit"
  | "invoiceCount";
type SortDirection = "asc" | "desc";

type CreditInvoice = {
  invoice_id: string;
  invoice_number: string | null;
  status: string | null;
  invoice_date: Date | null;
  due_date: Date | null;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
};

type CreditClientItem = {
  client_id: string;
  client_name: string;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  default_payment_term: string | null;
  default_credit_days: number | null;
  credit_limit: number;
  has_credit_terms: boolean;
  invoice_count: number;
  pending_amount: number;
  overdue_amount: number;
  invoices: CreditInvoice[];
};

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
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

function buildClientName(client?: {
  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
  billing_name?: string | null;
}) {
  if (!client) return "-";

  const name =
    client.billing_name ||
    [client.first_name, client.last_name_1, client.last_name_2]
      .filter(Boolean)
      .join(" ");

  return name.trim() || "-";
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

  if (start && end) return { gte: start, lt: end };
  if (start) return { gte: start };
  if (end) return { lt: end };

  return null;
}

function getPaginationParams(searchParams: URLSearchParams) {
  const page = normalizePositiveInt(searchParams.get("page"), 1, 100000);
  const pageSize = normalizePositiveInt(searchParams.get("pageSize"), 10, 100);

  return { page, pageSize };
}

function getScope(value: string | null): CreditClientScope {
  if (
    value === "WITH_BALANCE" ||
    value === "OVERDUE" ||
    value === "CREDIT_ONLY"
  ) {
    return value;
  }

  return "ALL";
}

function getSortKey(value: string | null): CreditClientSortKey {
  if (
    value === "client" ||
    value === "overdue" ||
    value === "creditLimit" ||
    value === "invoiceCount"
  ) {
    return value;
  }

  return "pending";
}

function getSortDirection(value: string | null): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

function buildClientSearchFilter(
  search?: string | null,
): Prisma.ClientWhereInput {
  const text = search?.trim();

  if (!text) return {};

  return {
    OR: [
      { first_name: { contains: text, mode: "insensitive" } },
      { last_name_1: { contains: text, mode: "insensitive" } },
      { last_name_2: { contains: text, mode: "insensitive" } },
      { phone_primary: { contains: text } },
      { email: { contains: text, mode: "insensitive" } },
      { billing_name: { contains: text, mode: "insensitive" } },
      { billing_email: { contains: text, mode: "insensitive" } },
      { billing_phone: { contains: text } },
      { tax_id: { contains: text } },
    ],
  };
}

function sortClients(
  items: CreditClientItem[],
  sortKey: CreditClientSortKey,
  sortDirection: SortDirection,
) {
  const direction = sortDirection === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    if (sortKey === "client") {
      return a.client_name.localeCompare(b.client_name, "es") * direction;
    }

    if (sortKey === "overdue") {
      return (a.overdue_amount - b.overdue_amount) * direction;
    }

    if (sortKey === "creditLimit") {
      return (a.credit_limit - b.credit_limit) * direction;
    }

    if (sortKey === "invoiceCount") {
      return (a.invoice_count - b.invoice_count) * direction;
    }

    return (a.pending_amount - b.pending_amount) * direction;
  });
}

function uniqueInvoices(invoices: CreditInvoice[]) {
  return Array.from(
    new Map(invoices.map((invoice) => [invoice.invoice_id, invoice])).values(),
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || null;
    const scope = getScope(searchParams.get("scope"));
    const sortKey = getSortKey(searchParams.get("sortKey"));
    const sortDirection = getSortDirection(searchParams.get("sortDirection"));
    const dateRange = getInclusiveDateRange(
      searchParams.get("dateFrom"),
      searchParams.get("dateTo"),
    );
    const { page, pageSize } = getPaginationParams(searchParams);

    const clientSearchFilter = buildClientSearchFilter(search);

    await refreshOverdueInvoices();

    const invoiceWhere: Prisma.InvoiceWhereInput = {
      status: { in: [...pendingInvoiceStatuses] },
      balance_amount: { gt: 0 },
      ...(dateRange ? { due_date: dateRange } : {}),
    };

    const creditClients = await prisma.client.findMany({
      where: {
        default_payment_term: "CREDIT",
        ...clientSearchFilter,
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
          where: invoiceWhere,
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
          orderBy: [{ due_date: "asc" }, { invoice_date: "desc" }],
        },
      },
    });

    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        ...invoiceWhere,
        ...(search
          ? {
              OR: [
                { invoice_number: { contains: search, mode: "insensitive" } },
                {
                  customer_snapshot_name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                { customer_snapshot_phone: { contains: search } },
                { client: clientSearchFilter },
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
      orderBy: [{ due_date: "asc" }, { invoice_date: "desc" }],
    });

    const clientsMap = new Map<
      string,
      Omit<
        CreditClientItem,
        "invoice_count" | "pending_amount" | "overdue_amount"
      >
    >();

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

      clientsMap.get(client.client_id)?.invoices.push({
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
      const invoices = uniqueInvoices(item.invoices);
      const pendingAmount = invoices.reduce(
        (total, invoice) => total + toNumber(invoice.balance_amount),
        0,
      );
      const overdueAmount = invoices
        .filter((invoice) => invoice.status === "OVERDUE")
        .reduce(
          (total, invoice) => total + toNumber(invoice.balance_amount),
          0,
        );

      return {
        ...item,
        invoices,
        invoice_count: invoices.length,
        pending_amount: pendingAmount,
        overdue_amount: overdueAmount,
      };
    });

    const filteredItems = items.filter((item) => {
      if (scope === "WITH_BALANCE") return item.pending_amount > 0;
      if (scope === "OVERDUE") return item.overdue_amount > 0;
      if (scope === "CREDIT_ONLY") return item.has_credit_terms;

      return item.has_credit_terms || item.pending_amount > 0;
    });

    const sortedItems = sortClients(filteredItems, sortKey, sortDirection);

    const totalItems = sortedItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * pageSize;
    const pagedItems = sortedItems.slice(skip, skip + pageSize);

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
            count: totalItems,
            credit_clients_count: creditClientsCount,
            total_pending: totalPending,
            total_overdue: totalOverdue,
          },
          items: pagedItems,
        },
        pagination: {
          page: safePage,
          pageSize,
          totalItems,
          totalPages,
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
