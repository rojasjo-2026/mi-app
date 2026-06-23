import { prisma } from "@/lib/prisma";
import type { FollowUpReportRequest, FollowUpReportResult } from "./types";
import { FOLLOW_UP_REPORT_SELECT, mapFollowUpToReportRow } from "./mapper";

export async function getFollowUpReport(
  request: FollowUpReportRequest,
): Promise<FollowUpReportResult> {
  const [totalItems, followUps] = await Promise.all([
    prisma.followUp.count({
      where: request.where,
    }),

    prisma.followUp.findMany({
      where: request.where,
      skip: (request.page - 1) * request.pageSize,
      take: request.pageSize,
      orderBy: [
        {
          target_date: "asc",
        },
        {
          created_at: "desc",
        },
      ],
      select: FOLLOW_UP_REPORT_SELECT,
    }),
  ]);

  return {
    columns: request.columns,
    rows: followUps.map((followUp) =>
      mapFollowUpToReportRow(followUp, request.columns),
    ),
    pagination: {
      page: request.page,
      pageSize: request.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / request.pageSize)),
    },
  };
}
