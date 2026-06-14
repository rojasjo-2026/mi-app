import type { Prisma } from "@prisma/client";
import type { ClientReportColumnKey } from "./constants";

export type ClientReportRequest = {
  page: number;
  pageSize: number;
  columns: ClientReportColumnKey[];
  where: Prisma.ClientWhereInput;
};

export type ClientReportRow = Partial<
  Record<ClientReportColumnKey, string | number>
>;

export type ClientReportResult = {
  columns: ClientReportColumnKey[];
  rows: ClientReportRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};
