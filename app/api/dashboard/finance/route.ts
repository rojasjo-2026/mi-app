import { NextResponse } from "next/server";
import type { Prisma, WorkBillingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { refreshOverdueInvoices } from "@/lib/services/invoiceOverdueService";

const pendingBillingStatuses: WorkBillingStatus[] = [
  "PENDING",
  "BILLING_ERROR",
];

type InvoiceStatusSummary = {
  paid: number;
  pending: number;
  overdue: number;
  partial: number;
  cancelled: number;
};

type TrendPoint = {
  label: string;
  invoiced: number;
  paid: number;
  pending: number;
  cost: number;
  profit: number;
};

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDateOnly(value?: string | null) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return { start, end };
}

function normalizeRange(searchParams: URLSearchParams) {
  const defaultRange = getDefaultDateRange();
  const requestedStart = parseDateOnly(searchParams.get("dateFrom"));
  const requestedEnd = parseDateOnly(searchParams.get("dateTo"));

  const start = requestedStart ?? defaultRange.start;
  const end = requestedEnd ?? defaultRange.end;

  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
    dateFrom: toDateInputValue(start),
    dateTo: toDateInputValue(end),
  };
}

function getPreviousRange(start: Date, end: Date) {
  const duration = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  previousStart.setHours(0, 0, 0, 0);
  previousEnd.setHours(23, 59, 59, 999);

  return {
    start: previousStart,
    end: previousEnd,
  };
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("es-CR", {
    month: "short",
  });
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getMainAmount(item: {
  final_amount: unknown;
  estimated_amount: unknown;
}) {
  const finalAmount = toNumber(item.final_amount);
  const estimatedAmount = toNumber(item.estimated_amount);

  return finalAmount > 0 ? finalAmount : estimatedAmount;
}

function getDateWhere(start: Date, end: Date) {
  return {
    gte: start,
    lte: end,
  };
}

async function getBillingMetrics(start: Date, end: Date) {
  const dateWhere = getDateWhere(start, end);

  const invoices = await prisma.invoice.findMany({
    where: {
      invoice_date: dateWhere,
    },
    select: {
      status: true,
      total_amount: true,
      paid_amount: true,
      balance_amount: true,
      currency: true,
    },
  });

  const payments = await prisma.invoicePayment.findMany({
    where: {
      payment_date: dateWhere,
    },
    select: {
      amount: true,
    },
  });

  const totalInvoiced = invoices
    .filter((invoice) => invoice.status !== "CANCELLED")
    .reduce((sum, invoice) => sum + toNumber(invoice.total_amount), 0);

  const totalPaid = payments.reduce(
    (sum, payment) => sum + toNumber(payment.amount),
    0,
  );

  const totalPending = invoices
    .filter((invoice) =>
      ["PENDING", "PARTIALLY_PAID", "OVERDUE"].includes(
        String(invoice.status ?? ""),
      ),
    )
    .reduce((sum, invoice) => sum + toNumber(invoice.balance_amount), 0);

  const totalOverdue = invoices
    .filter((invoice) => invoice.status === "OVERDUE")
    .reduce((sum, invoice) => sum + toNumber(invoice.balance_amount), 0);

  const totalCancelled = invoices
    .filter((invoice) => invoice.status === "CANCELLED")
    .reduce((sum, invoice) => sum + toNumber(invoice.total_amount), 0);

  const invoiceStatus: InvoiceStatusSummary = invoices.reduce(
    (summary, invoice) => {
      if (invoice.status === "PAID") summary.paid += 1;
      else if (invoice.status === "PENDING") summary.pending += 1;
      else if (invoice.status === "PARTIALLY_PAID") summary.partial += 1;
      else if (invoice.status === "OVERDUE") summary.overdue += 1;
      else if (invoice.status === "CANCELLED") summary.cancelled += 1;

      return summary;
    },
    {
      paid: 0,
      pending: 0,
      overdue: 0,
      partial: 0,
      cancelled: 0,
    },
  );

  return {
    currency: invoices.find((invoice) => invoice.currency)?.currency ?? null,
    invoiceCount: invoices.length,
    paidInvoiceCount: invoiceStatus.paid,
    openInvoiceCount:
      invoiceStatus.pending + invoiceStatus.partial + invoiceStatus.overdue,
    overdueInvoiceCount: invoiceStatus.overdue,
    cancelledInvoiceCount: invoiceStatus.cancelled,
    totalInvoiced,
    totalPaid,
    totalPending,
    totalOverdue,
    totalCancelled,
    invoiceStatus,
  };
}

async function getPendingBillablesMetrics(start: Date, end: Date) {
  const installationWhere: Prisma.InstallationWhereInput = {
    billing_status: {
      in: pendingBillingStatuses,
    },
    estimated_amount: {
      not: null,
    },
    installation_date: getDateWhere(start, end),
  };

  const followUpWhere: Prisma.FollowUpWhereInput = {
    billing_status: {
      in: pendingBillingStatuses,
    },
    estimated_amount: {
      not: null,
    },
    target_date: getDateWhere(start, end),
  };

  const [installations, followUps] = await prisma.$transaction([
    prisma.installation.findMany({
      where: installationWhere,
      select: {
        estimated_amount: true,
        final_amount: true,
        cost_amount: true,
      },
    }),
    prisma.followUp.findMany({
      where: followUpWhere,
      select: {
        estimated_amount: true,
        final_amount: true,
        cost_amount: true,
      },
    }),
  ]);

  const items = [...installations, ...followUps];

  const totalAmount = items.reduce((sum, item) => sum + getMainAmount(item), 0);

  const totalCost = items.reduce(
    (sum, item) => sum + toNumber(item.cost_amount),
    0,
  );

  return {
    count: items.length,
    totalAmount,
    totalCost,
    estimatedProfit: totalAmount - totalCost,
  };
}

async function getTrendPoint(monthStart: Date): Promise<TrendPoint> {
  const monthEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const [billing, pendingBillables] = await Promise.all([
    getBillingMetrics(monthStart, monthEnd),
    getPendingBillablesMetrics(monthStart, monthEnd),
  ]);

  return {
    label: getMonthLabel(monthStart),
    invoiced: billing.totalInvoiced,
    paid: billing.totalPaid,
    pending: billing.totalPending,
    cost: pendingBillables.totalCost,
    profit: pendingBillables.estimatedProfit,
  };
}

async function getTrends(end: Date) {
  const currentMonthStart = new Date(end.getFullYear(), end.getMonth(), 1);
  const monthStarts = Array.from({ length: 6 }, (_, index) =>
    addMonths(currentMonthStart, index - 5),
  );

  return Promise.all(
    monthStarts.map((monthStart) => getTrendPoint(monthStart)),
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    await refreshOverdueInvoices();

    const range = normalizeRange(searchParams);
    const previousRange = getPreviousRange(range.start, range.end);

    const [
      billing,
      pendingBillables,
      previousBilling,
      previousPendingBillables,
      trends,
    ] = await Promise.all([
      getBillingMetrics(range.start, range.end),
      getPendingBillablesMetrics(range.start, range.end),
      getBillingMetrics(previousRange.start, previousRange.end),
      getPendingBillablesMetrics(previousRange.start, previousRange.end),
      getTrends(range.end),
    ]);

    const potentialTotal = billing.totalInvoiced + pendingBillables.totalAmount;
    const collectionRate =
      billing.totalInvoiced > 0
        ? (billing.totalPaid / billing.totalInvoiced) * 100
        : 0;
    const overdueRate =
      billing.totalPending > 0
        ? (billing.totalOverdue / billing.totalPending) * 100
        : 0;
    const estimatedMargin =
      pendingBillables.totalAmount > 0
        ? (pendingBillables.estimatedProfit / pendingBillables.totalAmount) *
          100
        : 0;

    const previousPotentialTotal =
      previousBilling.totalInvoiced + previousPendingBillables.totalAmount;

    return NextResponse.json(
      {
        success: true,
        data: {
          currency: billing.currency,
          period: {
            dateFrom: range.dateFrom,
            dateTo: range.dateTo,
          },
          billing: {
            totalInvoiced: billing.totalInvoiced,
            totalPaid: billing.totalPaid,
            totalPending: billing.totalPending,
            totalOverdue: billing.totalOverdue,
            totalCancelled: billing.totalCancelled,
            invoiceCount: billing.invoiceCount,
            paidInvoiceCount: billing.paidInvoiceCount,
            openInvoiceCount: billing.openInvoiceCount,
            overdueInvoiceCount: billing.overdueInvoiceCount,
            cancelledInvoiceCount: billing.cancelledInvoiceCount,
          },
          pendingBillables,
          indicators: {
            potentialTotal,
            collectionRate,
            overdueRate,
            estimatedMargin,
          },
          previousPeriod: {
            totalInvoiced: previousBilling.totalInvoiced,
            totalPaid: previousBilling.totalPaid,
            totalPending: previousBilling.totalPending,
            totalOverdue: previousBilling.totalOverdue,
            pendingBillablesAmount: previousPendingBillables.totalAmount,
            estimatedProfit: previousPendingBillables.estimatedProfit,
            potentialTotal: previousPotentialTotal,
          },
          trends,
          invoiceStatus: billing.invoiceStatus,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/dashboard/finance error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
