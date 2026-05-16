import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function findAppSettings() {
  return prisma.appSettings.findFirst({
    orderBy: {
      created_at: "asc",
    },
  });
}

export async function createAppSettings(data?: Prisma.AppSettingsCreateInput) {
  return prisma.appSettings.create({
    data: data ?? {},
  });
}

export async function updateAppSettings(
  settingsId: string,
  data: Prisma.AppSettingsUpdateInput,
) {
  return prisma.appSettings.update({
    where: {
      settings_id: settingsId,
    },
    data,
  });
}
