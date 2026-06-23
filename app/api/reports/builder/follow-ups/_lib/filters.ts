import type { NextRequest } from "next/server";
import type { Prisma, WorkBillingStatus } from "@prisma/client";
import {
  ACTIVE_CONTACT_FLOW_STATUSES,
  PENDING_INVOICE_STATUSES,
  VALID_BILLING_STATUSES,
} from "./constants";
import type { FollowUpReportRequest } from "./types";
import {
  applyDateRange,
  isUuid,
  parsePositiveInt,
  parsePositiveNumber,
  sanitizeColumns,
} from "./utils";

export function parseFollowUpReportRequest(
  request: NextRequest,
): FollowUpReportRequest {
  const { searchParams } = new URL(request.url);

  const page = parsePositiveInt(searchParams.get("page"), 1, 100000);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 25, 1000);

  const search = searchParams.get("search")?.trim() ?? "";
  const clientId = searchParams.get("clientId") ?? "all";
  const installationId = searchParams.get("installationId") ?? "all";
  const followUpStatusId = searchParams.get("followUpStatusId") ?? "all";
  const technicianId = searchParams.get("technicianId") ?? "all";
  const operationalZoneId = searchParams.get("operationalZoneId") ?? "all";
  const billingStatus = searchParams.get("billingStatus") ?? "all";
  const completionStatus = searchParams.get("completionStatus") ?? "all";
  const pendingBilling = searchParams.get("pendingBilling") ?? "all";
  const contactFlow = searchParams.get("contactFlow") ?? "all";
  const contactAttempts = searchParams.get("contactAttempts") ?? "all";
  const priority = searchParams.get("priority") ?? "all";
  const maintenanceType = searchParams.get("maintenanceType") ?? "all";
  const createdFromSource = searchParams.get("createdFromSource") ?? "all";
  const countryCode = searchParams.get("countryCode") ?? "all";

  const minEstimatedAmount = parsePositiveNumber(
    searchParams.get("minEstimatedAmount"),
  );
  const maxEstimatedAmount = parsePositiveNumber(
    searchParams.get("maxEstimatedAmount"),
  );

  const targetFrom = searchParams.get("targetFrom");
  const targetTo = searchParams.get("targetTo");
  const dueFrom = searchParams.get("dueFrom");
  const dueTo = searchParams.get("dueTo");
  const scheduledFrom = searchParams.get("scheduledFrom");
  const scheduledTo = searchParams.get("scheduledTo");
  const completedFrom = searchParams.get("completedFrom");
  const completedTo = searchParams.get("completedTo");
  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const updatedFrom = searchParams.get("updatedFrom");
  const updatedTo = searchParams.get("updatedTo");

  const columns = sanitizeColumns(searchParams.get("columns"));

  const where: Prisma.FollowUpWhereInput = {};
  const andFilters: Prisma.FollowUpWhereInput[] = [];

  if (search) {
    andFilters.push({
      OR: [
        { reason: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { billing_notes: { contains: search, mode: "insensitive" } },
        { billing_block_reason: { contains: search, mode: "insensitive" } },
        { maintenance_type: { contains: search, mode: "insensitive" } },
        { created_from: { contains: search, mode: "insensitive" } },
        {
          client: {
            is: {
              OR: [
                { display_name: { contains: search, mode: "insensitive" } },
                { first_name: { contains: search, mode: "insensitive" } },
                { last_name_1: { contains: search, mode: "insensitive" } },
                { last_name_2: { contains: search, mode: "insensitive" } },
                { company_name: { contains: search, mode: "insensitive" } },
                { commercial_name: { contains: search, mode: "insensitive" } },
                { phone_primary: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          installation: {
            is: {
              OR: [
                { description: { contains: search, mode: "insensitive" } },
                {
                  technical_observations: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                { address_line: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } },
                { zone: { contains: search, mode: "insensitive" } },
                {
                  service_type: {
                    is: {
                      OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { code: { contains: search, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });
  }

  if (clientId !== "all" && isUuid(clientId)) {
    where.client_id = clientId;
  }

  if (installationId === "without") {
    where.installation_id = null;
  } else if (installationId !== "all" && isUuid(installationId)) {
    where.installation_id = installationId;
  }

  if (followUpStatusId !== "all") {
    const parsedStatusId = Number(followUpStatusId);

    if (Number.isInteger(parsedStatusId) && parsedStatusId > 0) {
      where.follow_up_status_id = parsedStatusId;
    }
  }

  if (technicianId === "without") {
    where.technician_id = null;
  } else if (technicianId !== "all" && isUuid(technicianId)) {
    where.technician_id = technicianId;
  }

  if (operationalZoneId === "without") {
    where.operational_zone_id = null;
  } else if (operationalZoneId !== "all" && isUuid(operationalZoneId)) {
    where.operational_zone_id = operationalZoneId;
  }

  if (VALID_BILLING_STATUSES.has(billingStatus)) {
    where.billing_status = billingStatus as WorkBillingStatus;
  }

  if (completionStatus === "completed") {
    where.completed_at = {
      not: null,
    };
  }

  if (completionStatus === "pending") {
    where.completed_at = null;
  }

  if (completionStatus === "overdue") {
    where.completed_at = null;
    where.due_date = {
      lt: new Date(),
    };
  }

  if (pendingBilling === "with") {
    where.invoices = {
      some: {
        status: {
          in: [...PENDING_INVOICE_STATUSES],
        },
        balance_amount: {
          gt: 0,
        },
      },
    };
  }

  if (pendingBilling === "without") {
    where.invoices = {
      none: {
        status: {
          in: [...PENDING_INVOICE_STATUSES],
        },
        balance_amount: {
          gt: 0,
        },
      },
    };
  }

  if (contactFlow === "with") {
    where.maintenance_contact_flows = {
      some: {
        status: {
          in: [...ACTIVE_CONTACT_FLOW_STATUSES],
        },
      },
    };
  }

  if (contactFlow === "without") {
    where.maintenance_contact_flows = {
      none: {
        status: {
          in: [...ACTIVE_CONTACT_FLOW_STATUSES],
        },
      },
    };
  }

  if (contactAttempts === "with") {
    where.contact_attempts = {
      some: {},
    };
  }

  if (contactAttempts === "without") {
    where.contact_attempts = {
      none: {},
    };
  }

  if (priority !== "all") {
    const parsedPriority = Number(priority);

    if (Number.isInteger(parsedPriority) && parsedPriority > 0) {
      where.priority = parsedPriority;
    }
  }

  if (maintenanceType !== "all" && maintenanceType.trim()) {
    where.maintenance_type = maintenanceType;
  }

  if (createdFromSource !== "all" && createdFromSource.trim()) {
    where.created_from = createdFromSource;
  }

  if (countryCode !== "all" && countryCode.trim()) {
    andFilters.push({
      client: {
        is: {
          country_code: countryCode,
        },
      },
    });
  }

  if (minEstimatedAmount !== null || maxEstimatedAmount !== null) {
    where.estimated_amount = {
      ...(minEstimatedAmount !== null ? { gte: minEstimatedAmount } : {}),
      ...(maxEstimatedAmount !== null ? { lte: maxEstimatedAmount } : {}),
    };
  }

  applyDateRange(where, "target_date", targetFrom, targetTo);
  applyDateRange(where, "due_date", dueFrom, dueTo);
  applyDateRange(where, "scheduled_date", scheduledFrom, scheduledTo);
  applyDateRange(where, "completed_at", completedFrom, completedTo);
  applyDateRange(where, "created_at", createdFrom, createdTo);
  applyDateRange(where, "updated_at", updatedFrom, updatedTo);

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  return {
    page,
    pageSize,
    columns,
    where,
  };
}
