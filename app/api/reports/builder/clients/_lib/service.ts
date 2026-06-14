import { prisma } from "@/lib/prisma";
import type { ClientReportRequest, ClientReportResult } from "./types";
import { CLIENT_REPORT_SELECT, mapClientToReportRow } from "./mapper";

export async function getClientReport(
  request: ClientReportRequest,
): Promise<ClientReportResult> {
  const [totalItems, clients] = await Promise.all([
    prisma.client.count({
      where: request.where,
    }),

    prisma.client.findMany({
      where: request.where,
      skip: (request.page - 1) * request.pageSize,
      take: request.pageSize,
      orderBy: [
        {
          created_at: "desc",
        },
      ],
      select: CLIENT_REPORT_SELECT,
    }),
  ]);

  return {
    columns: request.columns,
    rows: clients.map((client) =>
      mapClientToReportRow(client, request.columns),
    ),
    pagination: {
      page: request.page,
      pageSize: request.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / request.pageSize)),
    },
  };
}
