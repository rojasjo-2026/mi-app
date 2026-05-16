import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordPaymentRegisteredActivitySafely } from "@/lib/services/activityLogService";
import { validateRegisterPaymentInput } from "@/lib/validators/financeValidators";

export async function POST(req: Request) {
  try {
    const validationResult = validateRegisterPaymentInput(await req.json());

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, message: validationResult.message },
        { status: 400 },
      );
    }

    const body = validationResult.data;

    const invoiceId = body.invoice_id;
    const amount = body.amount;
    const method = body.method;

    const invoice = await prisma.invoice.findUnique({
      where: { invoice_id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: "Invoice not found" },
        { status: 404 },
      );
    }

    const currentBalance = Number(invoice.balance_amount);
    const totalAmount = Number(invoice.total_amount);

    if (invoice.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot register payment for a cancelled invoice",
        },
        { status: 400 },
      );
    }

    if (invoice.status === "PAID" && currentBalance <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot register payment for an invoice that is already paid",
        },
        { status: 400 },
      );
    }

    if (amount > currentBalance) {
      return NextResponse.json(
        { success: false, message: "Amount exceeds remaining balance" },
        { status: 400 },
      );
    }

    const newPaidAmount = Number(invoice.paid_amount) + amount;
    const balance = totalAmount - newPaidAmount;

    let newStatus: "PENDING" | "PARTIALLY_PAID" | "PAID" = "PENDING";
    let newBillingStatus: "INVOICED" | "PARTIALLY_PAID" | "PAID" = "INVOICED";

    if (newPaidAmount === 0) {
      newStatus = "PENDING";
      newBillingStatus = "INVOICED";
    } else if (newPaidAmount < totalAmount) {
      newStatus = "PARTIALLY_PAID";
      newBillingStatus = "PARTIALLY_PAID";
    } else {
      newStatus = "PAID";
      newBillingStatus = "PAID";
    }

    const { payment, updatedInvoice } = await prisma.$transaction(
      async (tx) => {
        const payment = await tx.invoicePayment.create({
          data: {
            invoice_id: invoiceId,
            amount,
            method,
            reference_number: body.reference_number ?? null,
            notes: body.notes ?? null,
          },
        });

        const updatedInvoice = await tx.invoice.update({
          where: { invoice_id: invoiceId },
          data: {
            paid_amount: newPaidAmount,
            balance_amount: balance,
            status: newStatus,
          },
        });

        if (invoice.installation_id) {
          await tx.installation.update({
            where: { installation_id: invoice.installation_id },
            data: {
              billing_status: newBillingStatus,
            },
          });
        }

        if (invoice.follow_up_id) {
          await tx.followUp.update({
            where: { follow_up_id: invoice.follow_up_id },
            data: {
              billing_status: newBillingStatus,
            },
          });
        }

        return { payment, updatedInvoice };
      },
    );

    await recordPaymentRegisteredActivitySafely({
      payment,
      invoiceBefore: invoice,
      invoiceAfter: updatedInvoice,
      createdBy: body.created_by ?? null,
    });

    return NextResponse.json(
      {
        success: true,
        data: payment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/invoice-payments error:", error);

    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 },
    );
  }
}
