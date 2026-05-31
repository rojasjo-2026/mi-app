import type { Prisma, WorkBillingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const followUpInclude = {
  client: true,
  installation: true,
  follow_up_status: true,
  technician: true,
};

const followUpDetailInclude = {
  client: true,
  installation: true,
  follow_up_status: true,
  technician: true,
  contact_attempts: {
    orderBy: {
      attempt_datetime: "desc" as const,
    },
  },
};

export type CreateFollowUpData = {
  client_id: string;
  installation_id: string | null;
  operational_zone_id?: string | null;
  follow_up_status_id: number;
  target_date: Date;
  due_date: Date | null;
  reason: string | null;
  priority: number;
  notes: string | null;
  created_from: string;

  estimated_amount?: number | null;
  final_amount?: number | null;
  cost_amount?: number | null;
  billing_status?: WorkBillingStatus;
  billing_notes?: string | null;
  maintenance_type?: string | null;
  technician_id?: string | null;
};

export type UpdateFollowUpData = Partial<{
  target_date: Date;
  due_date: Date | null;
  reason: string | null;
  priority: number;
  notes: string | null;
  operational_zone_id: string | null;

  estimated_amount: number | null;
  final_amount: number | null;
  cost_amount: number | null;
  billing_status: WorkBillingStatus;
  billing_notes: string | null;
  maintenance_type: string | null;
  technician_id: string | null;
}>;

export type FindFollowUpsSortKey =
  | "maintenance"
  | "client"
  | "installation"
  | "targetDate"
  | "scheduledDate"
  | "technician"
  | "priority"
  | "amount"
  | "billing"
  | "status";

export type FindFollowUpsParams = {
  client_id?: string;
  installation_id?: string;
  operational_zone_id?: string;
  status?: string;
  priority?: number;
  search?: string;
  timing?: string;
  billingStatus?: string;
  page?: number;
  pageSize?: number;
  sortKey?: FindFollowUpsSortKey;
  sortDirection?: "asc" | "desc";
};

const BILLING_STATUSES: readonly WorkBillingStatus[] = [
  "PENDING",
  "INVOICED",
  "PARTIALLY_PAID",
  "PAID",
  "NOT_BILLABLE",
  "BILLING_ERROR",
  "CANCELLED",
];

function isWorkBillingStatus(
  value: string | undefined,
): value is WorkBillingStatus {
  if (!value) return false;
  return BILLING_STATUSES.includes(value as WorkBillingStatus);
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
}

function buildFollowUpWhere(params: FindFollowUpsParams) {
  const {
    client_id,
    installation_id,
    operational_zone_id,
    status,
    priority,
    search,
    timing,
    billingStatus,
  } = params;

  const where: Prisma.FollowUpWhereInput = {
    ...(client_id ? { client_id } : {}),
    ...(installation_id ? { installation_id } : {}),
    ...(operational_zone_id ? { operational_zone_id } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(status
      ? {
          follow_up_status: {
            code: status,
          },
        }
      : {}),
    ...(isWorkBillingStatus(billingStatus)
      ? { billing_status: billingStatus }
      : {}),
  };

  if (search) {
    where.OR = [
      {
        reason: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        maintenance_type: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        billing_notes: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        client: {
          is: {
            OR: [
              {
                first_name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                last_name_1: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                last_name_2: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                phone_primary: {
                  contains: search,
                },
              },
            ],
          },
        },
      },
      {
        installation: {
          is: {
            description: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        follow_up_status: {
          is: {
            OR: [
              {
                code: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      },
    ];
  }

  if (timing && timing !== "all") {
    const { start, end } = getTodayRange();

    if (timing === "overdue") {
      where.target_date = { lt: start };
      where.NOT = { follow_up_status: { code: "completed" } };
    }

    if (timing === "today") {
      where.target_date = { gte: start, lt: end };
      where.NOT = { follow_up_status: { code: "completed" } };
    }

    if (timing === "upcoming") {
      where.target_date = { gte: end };
      where.NOT = { follow_up_status: { code: "completed" } };
    }
  }

  return where;
}

function buildOrderBy(
  sortKey: FindFollowUpsSortKey = "targetDate",
  sortDirection: "asc" | "desc" = "asc",
): Prisma.FollowUpOrderByWithRelationInput[] {
  const direction = sortDirection === "desc" ? "desc" : "asc";

  if (sortKey === "maintenance") {
    return [{ maintenance_type: direction }, { target_date: "asc" }];
  }

  if (sortKey === "client") {
    return [{ client: { first_name: direction } }, { target_date: "asc" }];
  }

  if (sortKey === "installation") {
    return [
      { installation: { description: direction } },
      { target_date: "asc" },
    ];
  }

  if (sortKey === "scheduledDate") {
    return [{ scheduled_date: direction }, { target_date: "asc" }];
  }

  if (sortKey === "technician") {
    return [{ target_date: direction }, { created_at: "desc" }];
  }

  if (sortKey === "priority") {
    return [{ priority: direction }, { target_date: "asc" }];
  }

  if (sortKey === "amount") {
    return [{ final_amount: direction }, { estimated_amount: direction }];
  }

  if (sortKey === "billing") {
    return [{ billing_status: direction }, { target_date: "asc" }];
  }

  if (sortKey === "status") {
    return [{ follow_up_status: { code: direction } }, { target_date: "asc" }];
  }

  return [{ target_date: direction }, { created_at: "desc" }];
}

export async function findClientById(id: string) {
  return prisma.client.findUnique({
    where: {
      client_id: id,
    },
    select: {
      client_id: true,
    },
  });
}

export async function findInstallationById(id: string) {
  return prisma.installation.findUnique({
    where: {
      installation_id: id,
    },
    select: {
      installation_id: true,
      client_id: true,
      operational_zone_id: true,
    },
  });
}

export async function findInstallationWithClientById(id: string) {
  return prisma.installation.findUnique({
    where: {
      installation_id: id,
    },
    include: {
      client: true,
    },
  });
}

export async function findPendingFollowUpStatus() {
  return prisma.followUpStatus.findUnique({
    where: {
      code: "pending",
    },
  });
}

export async function findCompletedFollowUpStatus() {
  return prisma.followUpStatus.findUnique({
    where: {
      code: "completed",
    },
  });
}

export async function findActiveCompletedFollowUpStatus() {
  return prisma.followUpStatus.findFirst({
    where: {
      OR: [
        { code: "completed" },
        { code: "COMPLETED" },
        { name: "Completed" },
        { name: "completed" },
      ],
      is_active: true,
    },
  });
}

export async function findConfirmedFollowUpStatus() {
  return prisma.followUpStatus.findFirst({
    where: {
      OR: [
        { code: "confirmed" },
        { code: "CONFIRMED" },
        { name: "Confirmed" },
        { name: "confirmed" },
        { name: "Confirmado" },
        { name: "confirmado" },
      ],
      is_active: true,
    },
  });
}

export async function findPostponedFollowUpStatus() {
  return prisma.followUpStatus.findUnique({
    where: {
      code: "postponed",
    },
  });
}

export async function findFollowUpById(id: string) {
  return prisma.followUp.findUnique({
    where: {
      follow_up_id: id,
    },
    include: followUpDetailInclude,
  });
}

export async function createFollowUp(data: CreateFollowUpData) {
  return prisma.followUp.create({
    data,
    include: followUpInclude,
  });
}

export async function completeFollowUp(
  id: string,
  follow_up_status_id: number,
) {
  return prisma.followUp.update({
    where: {
      follow_up_id: id,
    },
    data: {
      follow_up_status_id,
      completed_at: new Date(),
    },
    include: followUpDetailInclude,
  });
}

export async function confirmFollowUp(
  id: string,
  data: {
    follow_up_status_id: number;
    scheduled_date: Date;
  },
) {
  return prisma.followUp.update({
    where: {
      follow_up_id: id,
    },
    data: {
      follow_up_status_id: data.follow_up_status_id,
      scheduled_date: data.scheduled_date,
    },
    include: followUpDetailInclude,
  });
}

export async function postponeFollowUp(
  id: string,
  data: {
    target_date: Date;
    due_date: Date | null;
    follow_up_status_id: number;
  },
) {
  return prisma.followUp.update({
    where: {
      follow_up_id: id,
    },
    data,
    include: followUpDetailInclude,
  });
}

export async function updateFollowUp(id: string, data: UpdateFollowUpData) {
  return prisma.followUp.update({
    where: {
      follow_up_id: id,
    },
    data,
    include: followUpDetailInclude,
  });
}

export async function findFollowUps(params: FindFollowUpsParams) {
  const page = Math.max(1, Math.floor(Number(params.page) || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Math.floor(Number(params.pageSize) || 25)),
  );
  const skip = (page - 1) * pageSize;
  const where = buildFollowUpWhere(params);
  const orderBy = buildOrderBy(params.sortKey, params.sortDirection);

  const [data, totalItems, total, pending, completed, pendingBilling] =
    await prisma.$transaction([
      prisma.followUp.findMany({
        where,
        include: followUpInclude,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.followUp.count({ where }),
      prisma.followUp.count({
        where: buildFollowUpWhere({
          ...params,
          status: undefined,
          timing: undefined,
        }),
      }),
      prisma.followUp.count({
        where: buildFollowUpWhere({
          ...params,
          status: "pending",
          timing: undefined,
        }),
      }),
      prisma.followUp.count({
        where: buildFollowUpWhere({
          ...params,
          status: "completed",
          timing: undefined,
        }),
      }),
      prisma.followUp.count({
        where: {
          ...buildFollowUpWhere({
            ...params,
            status: undefined,
            timing: undefined,
          }),
          billing_status: "PENDING",
          NOT: { follow_up_status: { code: "completed" } },
        },
      }),
    ]);

  const { start, end } = getTodayRange();
  const baseMetricsWhere = buildFollowUpWhere({
    ...params,
    status: undefined,
    timing: undefined,
  });

  const [overdue, today] = await prisma.$transaction([
    prisma.followUp.count({
      where: {
        ...baseMetricsWhere,
        target_date: { lt: start },
        NOT: { follow_up_status: { code: "completed" } },
      },
    }),
    prisma.followUp.count({
      where: {
        ...baseMetricsWhere,
        target_date: { gte: start, lt: end },
        NOT: { follow_up_status: { code: "completed" } },
      },
    }),
  ]);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
    metrics: {
      total,
      pending,
      completed,
      overdue,
      today,
      pendingBilling,
    },
  };
}

export async function createMaintenanceContactFlowForFollowUp(data: {
  follow_up_id: string;
  client_id: string;
  installation_id: string | null;
  trigger_date: Date;
  contact_phone?: string | null;
}) {
  return prisma.maintenanceContactFlow.create({
    data: {
      follow_up_id: data.follow_up_id,
      client_id: data.client_id,
      installation_id: data.installation_id,
      trigger_date: data.trigger_date,
      contact_phone: data.contact_phone ?? null,
      status: "PENDING",
    },
  });
}
