import type {
  ActivityLogAction,
  ActivityLogCategory,
  ActivityLogVisibility,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type FindActivityLogsParams = {
  client_id?: string;
  entity_type?: string;
  entity_id?: string;
  category?: ActivityLogCategory;
  action?: ActivityLogAction;
  search?: string;
  date_from?: Date;
  date_to?: Date;
  allowed_visibilities?: ActivityLogVisibility[];
  take?: number;
  skip?: number;
};

function buildActivityLogWhere(
  params: FindActivityLogsParams,
): Prisma.ActivityLogWhereInput {
  const search = params.search?.trim();

  return {
    ...(params.client_id ? { client_id: params.client_id } : {}),
    ...(params.entity_type ? { entity_type: params.entity_type } : {}),
    ...(params.entity_id ? { entity_id: params.entity_id } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.action ? { action: params.action } : {}),
    ...(params.allowed_visibilities?.length
      ? {
          visibility: {
            in: params.allowed_visibilities,
          },
        }
      : {}),
    ...(params.date_from || params.date_to
      ? {
          created_at: {
            ...(params.date_from ? { gte: params.date_from } : {}),
            ...(params.date_to ? { lte: params.date_to } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              field_name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              created_by: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              old_value: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              new_value: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };
}

export async function createActivityLog(
  data: Prisma.ActivityLogUncheckedCreateInput,
) {
  return prisma.activityLog.create({
    data,
  });
}

export async function createManyActivityLogs(
  data: Prisma.ActivityLogCreateManyInput[],
) {
  if (data.length === 0) {
    return { count: 0 };
  }

  return prisma.activityLog.createMany({
    data,
  });
}

export async function findActivityLogs(params: FindActivityLogsParams) {
  return prisma.activityLog.findMany({
    where: buildActivityLogWhere(params),
    orderBy: {
      created_at: "desc",
    },
    take: params.take ?? 50,
    skip: params.skip ?? 0,
  });
}

export async function countActivityLogs(
  params: Omit<FindActivityLogsParams, "take" | "skip">,
) {
  return prisma.activityLog.count({
    where: buildActivityLogWhere(params),
  });
}
