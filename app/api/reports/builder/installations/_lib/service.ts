import { prisma } from "@/lib/prisma";
import type {
  InstallationReportRequest,
  InstallationReportResult,
} from "./types";
import {
  INSTALLATION_REPORT_SELECT,
  mapInstallationToReportRow,
} from "./mapper";

export async function getInstallationReport(
  request: InstallationReportRequest,
): Promise<InstallationReportResult> {
  const [totalItems, installations] = await Promise.all([
    prisma.installation.count({
      where: request.where,
    }),

    prisma.installation.findMany({
      where: request.where,
      skip: (request.page - 1) * request.pageSize,
      take: request.pageSize,
      orderBy: [
        {
          installation_date: "desc",
        },
        {
          created_at: "desc",
        },
      ],
      select: INSTALLATION_REPORT_SELECT,
    }),
  ]);

  return {
    columns: request.columns,
    rows: installations.map((installation) =>
      mapInstallationToReportRow(installation, request.columns),
    ),
    pagination: {
      page: request.page,
      pageSize: request.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / request.pageSize)),
    },
  };
}
