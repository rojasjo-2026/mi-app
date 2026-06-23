import { CLIENT_SOURCE } from "./clients";
import { FOLLOW_UP_SOURCE } from "./followUps";
import { INSTALLATION_SOURCE } from "./installations";

export const REPORT_SOURCE_CONFIGS = [
  CLIENT_SOURCE,
  INSTALLATION_SOURCE,
  FOLLOW_UP_SOURCE,
] as const;

export const REPORT_SOURCE_CONFIG_BY_KEY = {
  clients: CLIENT_SOURCE,
  installations: INSTALLATION_SOURCE,
  "follow-ups": FOLLOW_UP_SOURCE,
} as const;

export type ReportSourceConfig = (typeof REPORT_SOURCE_CONFIGS)[number];

export type ReportSourceKey = ReportSourceConfig["key"];

export type ReportSourceColumn = ReportSourceConfig["columns"][number];

export type ReportSourceColumnKey = ReportSourceColumn["key"];

export function getReportSourceConfig(source: ReportSourceKey) {
  return REPORT_SOURCE_CONFIG_BY_KEY[source];
}
