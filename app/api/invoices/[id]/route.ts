import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordInvoiceActivityChangesSafely } from "@/lib/services/activityLogService";

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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id: invoiceId } = await context.params;

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          message: "invoice id is required",
        },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      cancelled_reason?: string | null;
      changed_by?: string | null;
    };

    const cancelledReason = body.cancelled_reason ?? null;
    const changedBy = body.changed_by ?? null;

    const invoice = await prisma.invoice.findUnique({
      where: {
        invoice_id: invoiceId,
      },
      include: invoiceInclude,
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice not found",
        },
        { status: 404 },
      );
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice already cancelled",
        },
        { status: 400 },
      );
    }

    if (Number(invoice.paid_amount) > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot cancel invoice with payments. Reverse payments first.",
        },
        { status: 400 },
      );
    }

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: {
          invoice_id: invoiceId,
        },
        data: {
          status: "CANCELLED",
          cancelled_reason: cancelledReason,
        },
        include: invoiceInclude,
      });

      if (invoice.installation_id) {
        await tx.installation.update({
          where: {
            installation_id: invoice.installation_id,
          },
          data: {
            billing_status: "CANCELLED",
          },
        });
      }

      if (invoice.follow_up_id) {
        await tx.followUp.update({
          where: {
            follow_up_id: invoice.follow_up_id,
          },
          data: {
            billing_status: "CANCELLED",
          },
        });
      }

      return updated;
    });

    await recordInvoiceActivityChangesSafely({
      before: invoice,
      after: updatedInvoice,
      changedBy,
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedInvoice,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH /api/invoices/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
