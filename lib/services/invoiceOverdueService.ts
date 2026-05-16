import { prisma } from "@/lib/prisma";
import { recordInvoiceActivityChangesSafely } from "@/lib/services/activityLogService";

export async function refreshOverdueInvoices() {
  const now = new Date();

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ["PENDING", "PARTIALLY_PAID"],
      },
      due_date: {
        lt: now,
      },
      balance_amount: {
        gt: 0,
      },
    },
  });

  if (overdueInvoices.length === 0) {
    return [];
  }

  const updatedInvoices = await prisma.$transaction(
    overdueInvoices.map((invoice) =>
      prisma.invoice.update({
        where: { invoice_id: invoice.invoice_id },
        data: { status: "OVERDUE" },
      }),
    ),
  );

  await Promise.all(
    updatedInvoices.map((updatedInvoice, index) =>
      recordInvoiceActivityChangesSafely({
        before: overdueInvoices[index],
        after: updatedInvoice,
        changedBy: null,
      }),
    ),
  );

  return updatedInvoices;
}
