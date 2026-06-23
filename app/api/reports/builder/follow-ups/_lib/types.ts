import type { Prisma } from "@prisma/client";
import type { FollowUpReportColumnKey } from "./constants";

export type FollowUpReportRequest = {
  page: number;
  pageSize: number;
  columns: FollowUpReportColumnKey[];
  where: Prisma.FollowUpWhereInput;
};

export type FollowUpReportRow = Partial<
  Record<FollowUpReportColumnKey, string | number>
>;

export type FollowUpReportResult = {
  columns: FollowUpReportColumnKey[];
  rows: FollowUpReportRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};
