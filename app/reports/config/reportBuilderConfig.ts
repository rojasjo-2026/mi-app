import { REPORT_SOURCE_CONFIG_BY_KEY } from "./sources";
import type {
ReportColumn,
ReportColumnKey,
ReportFilters,
ActiveReportSource,
ReportSource,
} from "../types";

type SourceColumnInput = {
readonly key: string;
readonly label: string;
readonly description: string;
readonly group: string;
};

function mapColumns(columns: readonly SourceColumnInput[]): ReportColumn[] {
return columns.map((column) => ({
key: column.key as ReportColumnKey,
label: column.label,
description: column.description,
group: column.group,
}));
}

function mapDefaultColumns(columns: readonly string[]): ReportColumnKey[] {
return columns.map((column) => column as ReportColumnKey);
}

/**

* Fuentes visibles en la UI actual.
* Follow-ups queda configurado en records internos, pero no se muestra aquí todavía.
  */
  export const REPORT_SOURCES: Array<{
  key: ActiveReportSource;
  title: string;
  label: string;
  description: string;
  badge: string;
  }> = [
  {
  key: "clients",
  title: REPORT_SOURCE_CONFIG_BY_KEY.clients.label,
  label: REPORT_SOURCE_CONFIG_BY_KEY.clients.label,
  description: REPORT_SOURCE_CONFIG_BY_KEY.clients.description,
  badge: "Activo",
  },
  {
  key: "installations",
  title: REPORT_SOURCE_CONFIG_BY_KEY.installations.label,
  label: REPORT_SOURCE_CONFIG_BY_KEY.installations.label,
  description: REPORT_SOURCE_CONFIG_BY_KEY.installations.description,
  badge: "Activo",
  },
  ];

export const CLIENT_COLUMNS = mapColumns(
REPORT_SOURCE_CONFIG_BY_KEY.clients.columns,
);

export const INSTALLATION_COLUMNS = mapColumns(
REPORT_SOURCE_CONFIG_BY_KEY.installations.columns,
);

export const FOLLOW_UP_COLUMNS = mapColumns(
REPORT_SOURCE_CONFIG_BY_KEY["follow-ups"].columns,
);

export const REPORT_COLUMNS_BY_SOURCE: Record<ReportSource, ReportColumn[]> = {
clients: CLIENT_COLUMNS,
installations: INSTALLATION_COLUMNS,
"follow-ups": FOLLOW_UP_COLUMNS,
};

export const DEFAULT_COLUMNS_BY_SOURCE: Record<
  ReportSource,
  ReportColumnKey[]
> = {
  clients: mapDefaultColumns(
    REPORT_SOURCE_CONFIG_BY_KEY.clients.defaultColumns,
  ),
  installations: mapDefaultColumns(
    REPORT_SOURCE_CONFIG_BY_KEY.installations.defaultColumns,
  ),
  "follow-ups": mapDefaultColumns(
    REPORT_SOURCE_CONFIG_BY_KEY["follow-ups"].defaultColumns,
  ),
};

export const REPORT_ENDPOINTS: Record<ReportSource, string> = {
  clients: REPORT_SOURCE_CONFIG_BY_KEY.clients.endpoint,
  installations: REPORT_SOURCE_CONFIG_BY_KEY.installations.endpoint,
  "follow-ups": REPORT_SOURCE_CONFIG_BY_KEY["follow-ups"].endpoint,
};

export const METADATA_ENDPOINTS: Record<ReportSource, string> = {
clients: REPORT_SOURCE_CONFIG_BY_KEY.clients.metadataEndpoint,
installations: REPORT_SOURCE_CONFIG_BY_KEY.installations.metadataEndpoint,
"follow-ups": REPORT_SOURCE_CONFIG_BY_KEY["follow-ups"].metadataEndpoint,
};

export const EXPORT_TITLES_BY_SOURCE: Record<ReportSource, string> = {
clients: REPORT_SOURCE_CONFIG_BY_KEY.clients.exportTitle,
installations: REPORT_SOURCE_CONFIG_BY_KEY.installations.exportTitle,
"follow-ups": REPORT_SOURCE_CONFIG_BY_KEY["follow-ups"].exportTitle,
};

export const EXCEL_FILE_NAMES_BY_SOURCE: Record<ReportSource, string> = {
clients: REPORT_SOURCE_CONFIG_BY_KEY.clients.excelFileName,
installations: REPORT_SOURCE_CONFIG_BY_KEY.installations.excelFileName,
"follow-ups": REPORT_SOURCE_CONFIG_BY_KEY["follow-ups"].excelFileName,
};

export const PDF_FILE_NAMES_BY_SOURCE: Record<ReportSource, string> = {
clients: REPORT_SOURCE_CONFIG_BY_KEY.clients.pdfFileName,
installations: REPORT_SOURCE_CONFIG_BY_KEY.installations.pdfFileName,
"follow-ups": REPORT_SOURCE_CONFIG_BY_KEY["follow-ups"].pdfFileName,
};

export const EMPTY_MESSAGES_BY_SOURCE: Record<ReportSource, string> = {
clients: REPORT_SOURCE_CONFIG_BY_KEY.clients.emptyMessage,
installations: REPORT_SOURCE_CONFIG_BY_KEY.installations.emptyMessage,
"follow-ups": REPORT_SOURCE_CONFIG_BY_KEY["follow-ups"].emptyMessage,
};

export const initialFilters: ReportFilters = {
search: "",

clientType: "all",
status: "all",
whatsapp: "all",
autoContact: "all",
taxExempt: "all",

clientId: "all",
serviceTypeId: "all",
technicianId: "all",
installationId: "all",
followUpStatusId: "all",

installationStatus: "all",
billingStatus: "all",
isActive: "all",
completionStatus: "all",

pendingBilling: "all",
pendingMaintenance: "all",
contactFlow: "all",
contactAttempts: "all",

priority: "all",
maintenanceType: "all",
createdFromSource: "all",

countryCode: "all",
adminLevel1: "all",
adminLevel2: "all",
adminLevel3: "all",
city: "all",
zone: "all",
operationalZoneId: "all",

paymentTerm: "all",
preferredCurrency: "all",

minEstimatedAmount: "",
maxEstimatedAmount: "",

installationFrom: "",
installationTo: "",
warrantyFrom: "",
warrantyTo: "",

targetFrom: "",
targetTo: "",
dueFrom: "",
dueTo: "",
scheduledFrom: "",
scheduledTo: "",
completedFrom: "",
completedTo: "",

createdFrom: "",
createdTo: "",
updatedFrom: "",
updatedTo: "",
};

export const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

export const PDF_MAX_COLUMNS = 8;

export const EXCEL_EXPORT_LIMIT = 1000;

export const PDF_EXPORT_LIMIT = 300;
