import type { Prisma } from "@prisma/client";
import {
  PENDING_INVOICE_STATUSES,
  type FollowUpReportColumnKey,
} from "./constants";
import type { FollowUpReportRow } from "./types";
import { formatDate, getClientName, getPersonName, toNumber } from "./utils";

export const FOLLOW_UP_REPORT_SELECT = {
  follow_up_id: true,
  target_date: true,
  due_date: true,
  scheduled_date: true,
  reason: true,
  priority: true,
  notes: true,
  estimated_amount: true,
  final_amount: true,
  cost_amount: true,
  maintenance_type: true,
  created_from: true,
  billing_status: true,
  billing_notes: true,
  billing_block_reason: true,
  created_at: true,
  updated_at: true,
  completed_at: true,

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

  installation: {
    select: {
      installation_id: true,
      installation_date: true,
      address_line: true,
      city: true,
      admin_level_1: true,
      admin_level_2: true,
      admin_level_3: true,
      zone: true,
      service_type: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  },

  follow_up_status: {
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
      contact_attempts: true,
      maintenance_contact_flows: true,
      follow_up_notes: true,
      invoices: true,
    },
  },
} satisfies Prisma.FollowUpSelect;

type FollowUpReportFollowUp = Prisma.FollowUpGetPayload<{
  select: typeof FOLLOW_UP_REPORT_SELECT;
}>;

function getInstallationServiceType(followUp: FollowUpReportFollowUp) {
  return (
    followUp.installation?.service_type.name ||
    followUp.installation?.service_type.code ||
    ""
  );
}

function getInstallationReference(followUp: FollowUpReportFollowUp) {
  if (!followUp.installation) return "";

  const serviceType = getInstallationServiceType(followUp);
  const location = [
    followUp.installation.admin_level_1,
    followUp.installation.admin_level_2,
    followUp.installation.city,
  ]
    .filter(Boolean)
    .join(", ");

  if (serviceType && location) {
    return `${serviceType} - ${location}`;
  }

  return serviceType || location || followUp.installation.installation_id;
}

function getTechnicianName(followUp: FollowUpReportFollowUp) {
  if (!followUp.technician) return "";

  return getPersonName(followUp.technician);
}

export function mapFollowUpToReportRow(
  followUp: FollowUpReportFollowUp,
  columns: FollowUpReportColumnKey[],
): FollowUpReportRow {
  const pendingBillingAmount = followUp.invoices.reduce(
    (total, invoice) => total + toNumber(invoice.balance_amount),
    0,
  );

  const fullRow: Record<FollowUpReportColumnKey, string | number> = {
    follow_up_id: followUp.follow_up_id,
    client_name: getClientName(followUp.client),
    installation_reference: getInstallationReference(followUp),
    installation_service_type: getInstallationServiceType(followUp),
    follow_up_status:
      followUp.follow_up_status.name || followUp.follow_up_status.code,
    target_date: formatDate(followUp.target_date),
    due_date: formatDate(followUp.due_date),
    scheduled_date: formatDate(followUp.scheduled_date),
    completed_at: formatDate(followUp.completed_at),
    is_completed: followUp.completed_at ? "Sí" : "No",
    priority: followUp.priority,
    maintenance_type: followUp.maintenance_type ?? "",
    technician_name: getTechnicianName(followUp),
    created_from: followUp.created_from,
    billing_status: followUp.billing_status,
    estimated_amount: toNumber(followUp.estimated_amount),
    final_amount: toNumber(followUp.final_amount),
    cost_amount: toNumber(followUp.cost_amount),
    pending_billing: pendingBillingAmount,
    contact_attempts_count: followUp._count.contact_attempts,
    contact_flows_count: followUp._count.maintenance_contact_flows,
    follow_up_notes_count: followUp._count.follow_up_notes,
    invoices_count: followUp._count.invoices,
    operational_zone: followUp.operational_zone?.name ?? "",
    reason: followUp.reason ?? "",
    notes: followUp.notes ?? "",
    billing_notes: followUp.billing_notes ?? "",
    billing_block_reason: followUp.billing_block_reason ?? "",
    created_at: formatDate(followUp.created_at),
    updated_at: formatDate(followUp.updated_at),
  };

  return columns.reduce<FollowUpReportRow>((row, columnKey) => {
    row[columnKey] = fullRow[columnKey] ?? "";
    return row;
  }, {});
}
