import type { Prisma } from "@prisma/client";
import {
  PENDING_INVOICE_STATUSES,
  type InstallationReportColumnKey,
} from "./constants";
import type { InstallationReportRow } from "./types";
import { formatDate, getClientName, toNumber } from "./utils";

export const INSTALLATION_REPORT_SELECT = {
  installation_id: true,
  installation_date: true,
  description: true,
  technical_observations: true,
  estimated_amount: true,
  final_amount: true,
  cost_amount: true,
  warranty_months: true,
  warranty_end_date: true,
  technician_name: true,
  address_line: true,
  zone: true,
  city: true,
  admin_level_1: true,
  admin_level_2: true,
  admin_level_3: true,
  location_notes: true,
  reference_point: true,
  installation_status: true,
  is_active: true,
  billing_status: true,
  created_at: true,
  updated_at: true,
  client: {
    select: {
      display_name: true,
      company_name: true,
      commercial_name: true,
      first_name: true,
      last_name_1: true,
      last_name_2: true,
    },
  },
  service_type: {
    select: {
      code: true,
      name: true,
    },
  },
  technician: {
    select: {
      first_name: true,
      last_name_1: true,
      last_name_2: true,
    },
  },
  operational_zone: {
    select: {
      name: true,
    },
  },
  follow_ups: {
    where: {
      completed_at: null,
    },
    orderBy: [
      {
        target_date: "asc",
      },
    ],
    take: 1,
    select: {
      target_date: true,
      due_date: true,
      scheduled_date: true,
    },
  },
  invoices: {
    where: {
      status: {
        in: [...PENDING_INVOICE_STATUSES],
      },
    },
    select: {
      balance_amount: true,
    },
  },
  _count: {
    select: {
      components: true,
      follow_ups: true,
      invoices: true,
      maintenance_contact_flows: true,
    },
  },
} satisfies Prisma.InstallationSelect;

type InstallationReportInstallation = Prisma.InstallationGetPayload<{
  select: typeof INSTALLATION_REPORT_SELECT;
}>;

function getTechnicianName(installation: InstallationReportInstallation) {
  if (installation.technician) {
    return [
      installation.technician.first_name,
      installation.technician.last_name_1,
      installation.technician.last_name_2,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  return installation.technician_name ?? "";
}

function getPendingFollowUpDate(installation: InstallationReportInstallation) {
  const nextFollowUp = installation.follow_ups[0];

  if (!nextFollowUp) return "";

  return formatDate(
    nextFollowUp.scheduled_date ||
      nextFollowUp.due_date ||
      nextFollowUp.target_date,
  );
}

export function mapInstallationToReportRow(
  installation: InstallationReportInstallation,
  columns: InstallationReportColumnKey[],
): InstallationReportRow {
  const pendingBillingAmount = installation.invoices.reduce(
    (total, invoice) => total + toNumber(invoice.balance_amount),
    0,
  );

  const fullRow: Record<InstallationReportColumnKey, string | number> = {
    installation_id: installation.installation_id,
    client_name: getClientName(installation.client),
    service_type:
      installation.service_type.name || installation.service_type.code || "",
    installation_date: formatDate(installation.installation_date),
    installation_status: installation.installation_status,
    is_active: installation.is_active ? "Sí" : "No",
    billing_status: installation.billing_status,
    estimated_amount: toNumber(installation.estimated_amount),
    final_amount: toNumber(installation.final_amount),
    cost_amount: toNumber(installation.cost_amount),
    pending_billing: pendingBillingAmount,
    warranty_months: installation.warranty_months ?? "",
    warranty_end_date: formatDate(installation.warranty_end_date),
    technician_name: getTechnicianName(installation),
    address_line: installation.address_line ?? "",
    city: installation.city ?? "",
    admin_level_1: installation.admin_level_1 ?? "",
    admin_level_2: installation.admin_level_2 ?? "",
    admin_level_3: installation.admin_level_3 ?? "",
    zone: installation.zone ?? "",
    operational_zone: installation.operational_zone?.name ?? "",
    components_count: installation._count.components,
    follow_ups_count: installation._count.follow_ups,
    pending_follow_up_date: getPendingFollowUpDate(installation),
    invoices_count: installation._count.invoices,
    description: installation.description ?? "",
    technical_observations: installation.technical_observations ?? "",
    reference_point: installation.reference_point ?? "",
    location_notes: installation.location_notes ?? "",
    created_at: formatDate(installation.created_at),
    updated_at: formatDate(installation.updated_at),
  };

  return columns.reduce<InstallationReportRow>((row, columnKey) => {
    row[columnKey] = fullRow[columnKey] ?? "";
    return row;
  }, {});
}
