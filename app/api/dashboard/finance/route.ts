import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshOverdueInvoices } from "@/lib/services/invoiceOverdueService";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export async function GET() {
  try {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const nextMonthStart = startOfNextMonth(today);

    await refreshOverdueInvoices();

    const invoices = await prisma.invoice.findMany({
      where: {
        invoice_date: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      select: {
        status: true,
        total_amount: true,
        paid_amount: true,
        balance_amount: true,
      },
    });

    const payments = await prisma.invoicePayment.findMany({
      where: {
        payment_date: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      select: {
        amount: true,
      },
    });

    const totalInvoiced = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.total_amount),
      0,
    );

    const totalPaid = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const totalPending = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.balance_amount),
      0,
    );

    const totalOverdue = invoices
      .filter((invoice) => invoice.status === "OVERDUE")
      .reduce((sum, invoice) => sum + Number(invoice.balance_amount), 0);

    const totalPartiallyPaid = invoices
      .filter((invoice) => invoice.status === "PARTIALLY_PAID")
      .reduce((sum, invoice) => sum + Number(invoice.balance_amount), 0);

    return NextResponse.json(
      {
        success: true,
        data: {
          month: {
            total_invoiced: totalInvoiced,
            total_paid: totalPaid,
            total_pending: totalPending,
            total_partially_paid: totalPartiallyPaid,
            total_overdue: totalOverdue,
            invoice_count: invoices.length,
            payment_count: payments.length,
          },
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
