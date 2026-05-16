import { prisma } from "@/lib/prisma";

export function findPendingFollowUpStatus() {
  return prisma.followUpStatus.findFirst({
    where: {
      code: "pending",
    },
  });
}

export function findPendingFollowUpsWithInstallation(
  follow_up_status_id: number,
) {
  return prisma.followUp.findMany({
    where: {
      follow_up_status_id,
    },
    include: {
      client: true,
      installation: true,
      follow_up_status: true,
    },
    orderBy: {
      target_date: "asc",
    },
  });
}

/**
 * Extended version used by dashboard endpoints that require both
 * client and installation data for zone resolution and UI grouping.
 */
export function findPendingFollowUpsWithClientAndInstallation(
  follow_up_status_id: number,
) {
  return prisma.followUp.findMany({
    where: {
      follow_up_status_id,
    },
    include: {
      client: true,
      installation: true,
      follow_up_status: true,
    },
    orderBy: {
      target_date: "asc",
    },
  });
}
