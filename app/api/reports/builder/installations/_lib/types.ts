import type { Prisma } from "@prisma/client";
import type { InstallationReportColumnKey } from "./constants";

export type InstallationReportRequest = {
  page: number;
  pageSize: number;
  columns: InstallationReportColumnKey[];
  where: Prisma.InstallationWhereInput;
};

export type InstallationReportRow = Partial<
  Record<InstallationReportColumnKey, string | number>
>;

export type InstallationReportResult = {
  columns: InstallationReportColumnKey[];
  rows: InstallationReportRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};
