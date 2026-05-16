import { prisma } from "../lib/prisma";

export async function findInstallationById(id: string) {
  return prisma.installation.findUnique({
    where: { installation_id: id },
    include: {
      client: true,
      service_type: true,
      follow_ups: { orderBy: { target_date: "asc" } },
    },
  });
}

export async function updateInstallation(id: string, data: any) {
  return prisma.installation.update({
    where: { installation_id: id },
    data,
    include: {
      client: true,
      service_type: true,
      follow_ups: { orderBy: { target_date: "asc" } },
    },
  });
}
