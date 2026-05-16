import type {
  ActivityLogCategory,
  ActivityLogVisibility,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

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

export async function findActivityLogs(params: {
  client_id?: string;
  entity_type?: string;
  entity_id?: string;
  category?: ActivityLogCategory;
  allowed_visibilities?: ActivityLogVisibility[];
  take?: number;
}) {
  return prisma.activityLog.findMany({
    where: {
      ...(params.client_id ? { client_id: params.client_id } : {}),
      ...(params.entity_type ? { entity_type: params.entity_type } : {}),
      ...(params.entity_id ? { entity_id: params.entity_id } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.allowed_visibilities?.length
        ? {
            visibility: {
              in: params.allowed_visibilities,
            },
          }
        : {}),
    },
    orderBy: {
      created_at: "desc",
    },
    take: params.take ?? 50,
  });
}
