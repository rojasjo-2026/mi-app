import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshOverdueInvoices } from "@/lib/services/invoiceOverdueService";

export async function GET() {
  try {
    await refreshOverdueInvoices();

    // 🔥 INSTALLATIONS
    const installations = await prisma.installation.findMany({
      where: {
        is_active: true,
      },
      include: {
        client: {
          select: {
            client_id: true,
            first_name: true,
            last_name_1: true,
            last_name_2: true,
          },
        },
      },
    });

    // 🔥 FOLLOW UPS
    const followUps = await prisma.followUp.findMany({
      include: {
        client: {
          select: {
            client_id: true,
            first_name: true,
            last_name_1: true,
            last_name_2: true,
          },
        },
        installation: {
          select: {
            installation_id: true,
            description: true,
          },
        },
      },
    });

    await refreshOverdueInvoices();

    // 🔥 INVOICES
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
      },
    });

    // 🔥 CLASIFICACIÓN

    const pending = [
      ...installations
        .filter((i) => i.billing_status === "PENDING")
        .map((i) => ({
          type: "INSTALLATION",
          id: i.installation_id,
          description: i.description,
          amount: i.final_amount ?? i.estimated_amount,
          client: i.client,
          billing_status: i.billing_status,
        })),

      ...followUps
        .filter((f) => f.billing_status === "PENDING")
        .map((f) => ({
          type: "FOLLOW_UP",
          id: f.follow_up_id,
          description: f.reason,
          amount: f.final_amount ?? f.estimated_amount,
          client: f.client,
          billing_status: f.billing_status,
        })),
    ];

    const invoiced = invoices.filter(
      (i) => i.status === "PENDING" || i.status === "OVERDUE",
    );

    const paid = invoices.filter((i) => i.status === "PAID");

    const partial = invoices.filter((i) => i.status === "PARTIALLY_PAID");

    const blocked = [
      ...installations.filter((i) => i.billing_status === "NOT_BILLABLE"),
      ...followUps.filter((f) => f.billing_status === "NOT_BILLABLE"),
    ];

    return NextResponse.json(
      {
        success: true,
        data: {
          pending,
          invoiced,
          partial,
          paid,
          blocked,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/finance/work-queue error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
