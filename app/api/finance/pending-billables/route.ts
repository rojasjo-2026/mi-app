import { NextResponse } from "next/server";
import type { Prisma, WorkBillingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const pendingBillingStatuses: WorkBillingStatus[] = [
  "PENDING",
  "BILLING_ERROR",
];

const installationInclude = {
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
} as const satisfies Prisma.InstallationInclude;

const followUpInclude = {
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
} as const satisfies Prisma.FollowUpInclude;

type InstallationWithRelations = Prisma.InstallationGetPayload<{
  include: typeof installationInclude;
}>;

type FollowUpWithRelations = Prisma.FollowUpGetPayload<{
  include: typeof followUpInclude;
}>;

type PendingBillableItem = {
  id: string;
  type: "INSTALLATION" | "FOLLOW_UP";
  client_id: string;
  installation_id?: string | null;
  follow_up_id?: string | null;
  client: InstallationWithRelations["client"] | FollowUpWithRelations["client"];
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  description: string;
  date: Date | null;
  estimated_amount: number;
  final_amount: number;
  cost_amount: number;
  billing_status: WorkBillingStatus;
  billing_notes?: string | null;
  source_label: string;
  status_label?: string | null;
};

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getMainAmount(
  item: Pick<PendingBillableItem, "final_amount" | "estimated_amount">,
) {
  return item.final_amount > 0 ? item.final_amount : item.estimated_amount;
}

function buildClientName(client?: {
  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
}) {
  if (!client) return "-";

  const name = [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "-";
}

function isPendingBillingStatus(
  value: string | null,
): value is WorkBillingStatus {
  return Boolean(
    value && pendingBillingStatuses.includes(value as WorkBillingStatus),
  );
}

function parseDateParam(value: string | null, endOfDay = false) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return null;

  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  }

  return parsed;
}

function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, Math.floor(Number(searchParams.get("page")) || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Math.floor(Number(searchParams.get("pageSize")) || 15)),
  );

  return { page, pageSize };
}

function sortPendingItems(
  items: PendingBillableItem[],
  sortKey: string,
  sortDirection: string,
) {
  const direction = sortDirection === "desc" ? -1 : 1;

  return [...items].sort((a, b) => {
    if (sortKey === "type") {
      return a.source_label.localeCompare(b.source_label, "es") * direction;
    }

    if (sortKey === "client") {
      return a.client_name.localeCompare(b.client_name, "es") * direction;
    }

    if (sortKey === "work") {
      return a.description.localeCompare(b.description, "es") * direction;
    }

    if (sortKey === "amount") {
      return (getMainAmount(a) - getMainAmount(b)) * direction;
    }

    if (sortKey === "cost") {
      return (a.cost_amount - b.cost_amount) * direction;
    }

    if (sortKey === "profit") {
      const aProfit = getMainAmount(a) - a.cost_amount;
      const bProfit = getMainAmount(b) - b.cost_amount;

      return (aProfit - bProfit) * direction;
    }

    if (sortKey === "status") {
      return (
        String(a.billing_status).localeCompare(String(b.billing_status), "es") *
        direction
      );
    }

    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;

    return (aDate - bDate) * direction;
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const sortKey = searchParams.get("sortKey") || "date";
    const sortDirection = searchParams.get("sortDirection") || "desc";
    const dateFrom = parseDateParam(searchParams.get("dateFrom"));
    const dateTo = parseDateParam(searchParams.get("dateTo"), true);
    const { page, pageSize } = getPaginationParams(searchParams);

    const billingStatusFilter =
      status && status !== "ALL" && isPendingBillingStatus(status)
        ? [status]
        : pendingBillingStatuses;

    const dateRangeFilter =
      dateFrom || dateTo
        ? {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          }
        : undefined;

    const installationWhere: Prisma.InstallationWhereInput = {
      billing_status: {
        in: billingStatusFilter,
      },
      estimated_amount: {
        not: null,
      },
      ...(dateRangeFilter ? { installation_date: dateRangeFilter } : {}),
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
              { client: { phone_primary: { contains: search } } },
              { client: { tax_id: { contains: search } } },
              {
                client: {
                  billing_name: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const followUpWhere: Prisma.FollowUpWhereInput = {
      billing_status: {
        in: billingStatusFilter,
      },
      estimated_amount: {
        not: null,
      },
      ...(dateRangeFilter ? { target_date: dateRangeFilter } : {}),
      ...(search
        ? {
            OR: [
              { reason: { contains: search, mode: "insensitive" } },
              {
                installation: {
                  description: { contains: search, mode: "insensitive" },
                },
              },
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
              { client: { phone_primary: { contains: search } } },
              { client: { tax_id: { contains: search } } },
              {
                client: {
                  billing_name: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const [installations, followUps] = await prisma.$transaction([
      prisma.installation.findMany({
        where: installationWhere,
        include: installationInclude,
      }),
      prisma.followUp.findMany({
        where: followUpWhere,
        include: followUpInclude,
      }),
    ]);

    const installationItems: PendingBillableItem[] = installations.map(
      (installation) => ({
        id: installation.installation_id,
        type: "INSTALLATION",
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
      }),
    );

    const followUpItems: PendingBillableItem[] = followUps.map((followUp) => ({
      id: followUp.follow_up_id,
      type: "FOLLOW_UP",
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

    const sortedItems = sortPendingItems(
      [...installationItems, ...followUpItems],
      sortKey,
      sortDirection,
    );

    const totalItems = sortedItems.length;
    const skip = (page - 1) * pageSize;
    const pagedItems = sortedItems.slice(skip, skip + pageSize);

    const totalAmount = sortedItems.reduce(
      (total, item) => total + getMainAmount(item),
      0,
    );

    const totalCost = sortedItems.reduce(
      (total, item) => total + item.cost_amount,
      0,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            count: totalItems,
            total_amount: totalAmount,
            total_cost: totalCost,
            estimated_profit: totalAmount - totalCost,
          },
          items: pagedItems,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
          },
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
