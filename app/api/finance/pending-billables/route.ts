import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const pendingBillingStatuses = [
  "PENDING",
  "BILLING_ERROR",
  "PARTIALLY_PAID",
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
}) {
  if (!client) return "-";

  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const billingStatusFilter =
      status && status !== "ALL" ? [status] : [...pendingBillingStatuses];

    const installations = await prisma.installation.findMany({
      where: {
        billing_status: {
          in: billingStatusFilter as any,
        },
        estimated_amount: {
          not: null,
        },
        ...(search
          ? {
              OR: [
                { description: { contains: search, mode: "insensitive" } },
                {
                  client: {
                    first_name: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  client: {
                    last_name_1: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  client: {
                    last_name_2: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  client: {
                    phone_primary: { contains: search },
                  },
                },
                {
                  client: {
                    tax_id: { contains: search },
                  },
                },
                {
                  client: {
                    billing_name: { contains: search, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
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
            billing_address: true,
            tax_id: true,
            default_payment_term: true,
            default_credit_days: true,
            default_discount_rate: true,
            tax_exempt: true,
          },
        },
        service_type: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        installation_date: "desc",
      },
    });

    const followUps = await prisma.followUp.findMany({
      where: {
        billing_status: {
          in: billingStatusFilter as any,
        },
        estimated_amount: {
          not: null,
        },
        ...(search
          ? {
              OR: [
                { reason: { contains: search, mode: "insensitive" } },
                {
                  client: {
                    first_name: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  client: {
                    last_name_1: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  client: {
                    last_name_2: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  client: {
                    phone_primary: { contains: search },
                  },
                },
                {
                  client: {
                    tax_id: { contains: search },
                  },
                },
                {
                  client: {
                    billing_name: { contains: search, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
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
            billing_address: true,
            tax_id: true,
            default_payment_term: true,
            default_credit_days: true,
            default_discount_rate: true,
            tax_exempt: true,
          },
        },
        installation: {
          select: {
            installation_id: true,
            description: true,
          },
        },
        follow_up_status: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        target_date: "desc",
      },
    });

    const installationItems = installations.map((installation) => ({
      id: installation.installation_id,
      type: "INSTALLATION" as const,
      client_id: installation.client_id,
      installation_id: installation.installation_id,
      follow_up_id: null,
      client: installation.client,
      client_name: buildClientName(installation.client),
      client_phone: installation.client.phone_primary,
      client_email: installation.client.email,
      description:
        installation.description ||
        installation.service_type?.name ||
        "Instalación",
      date: installation.installation_date,
      estimated_amount: toNumber(installation.estimated_amount),
      final_amount: toNumber(installation.final_amount),
      cost_amount: toNumber(installation.cost_amount),
      billing_status: installation.billing_status,
      billing_notes: installation.billing_notes,
      source_label: "Instalación",
    }));

    const followUpItems = followUps.map((followUp) => ({
      id: followUp.follow_up_id,
      type: "FOLLOW_UP" as const,
      client_id: followUp.client_id,
      installation_id: followUp.installation_id,
      follow_up_id: followUp.follow_up_id,
      client: followUp.client,
      client_name: buildClientName(followUp.client),
      client_phone: followUp.client.phone_primary,
      client_email: followUp.client.email,
      description:
        followUp.reason ||
        followUp.installation?.description ||
        "Mantenimiento",
      date: followUp.target_date,
      estimated_amount: toNumber(followUp.estimated_amount),
      final_amount: toNumber(followUp.final_amount),
      cost_amount: toNumber(followUp.cost_amount),
      billing_status: followUp.billing_status,
      billing_notes: followUp.billing_notes,
      source_label: "Mantenimiento",
      status_label: followUp.follow_up_status?.name || null,
    }));

    const items = [...installationItems, ...followUpItems].sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;

      return bDate - aDate;
    });

    const totalAmount = items.reduce(
      (total, item) =>
        total +
        (item.final_amount > 0 ? item.final_amount : item.estimated_amount),
      0,
    );

    const totalCost = items.reduce(
      (total, item) => total + item.cost_amount,
      0,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            count: items.length,
            total_amount: totalAmount,
            total_cost: totalCost,
            estimated_profit: totalAmount - totalCost,
          },
          items,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/finance/pending-billables error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load pending billables",
      },
      { status: 500 },
    );
  }
}
