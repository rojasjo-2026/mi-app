import type { NextRequest } from "next/server";
import type {
  InstallationStatus,
  Prisma,
  WorkBillingStatus,
} from "@prisma/client";
import {
  PENDING_INVOICE_STATUSES,
  VALID_BILLING_STATUSES,
  VALID_INSTALLATION_STATUSES,
} from "./constants";
import type { InstallationReportRequest } from "./types";
import {
  applyDateRange,
  isUuid,
  parseBooleanFilter,
  parsePositiveInt,
  parsePositiveNumber,
  sanitizeColumns,
} from "./utils";

export function parseInstallationReportRequest(
  request: NextRequest,
): InstallationReportRequest {
  const { searchParams } = new URL(request.url);

  const page = parsePositiveInt(searchParams.get("page"), 1, 100000);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 25, 1000);

  const search = searchParams.get("search")?.trim() ?? "";
  const clientId = searchParams.get("clientId") ?? "all";
  const serviceTypeId = searchParams.get("serviceTypeId") ?? "all";
  const technicianId = searchParams.get("technicianId") ?? "all";
  const installationStatus = searchParams.get("installationStatus") ?? "all";
  const billingStatus = searchParams.get("billingStatus") ?? "all";
  const isActive = searchParams.get("isActive") ?? "all";
  const pendingBilling = searchParams.get("pendingBilling") ?? "all";
  const pendingMaintenance = searchParams.get("pendingMaintenance") ?? "all";
  const countryCode = searchParams.get("countryCode") ?? "all";
  const adminLevel1 = searchParams.get("adminLevel1") ?? "all";
  const adminLevel2 = searchParams.get("adminLevel2") ?? "all";
  const adminLevel3 = searchParams.get("adminLevel3") ?? "all";
  const city = searchParams.get("city") ?? "all";
  const zone = searchParams.get("zone") ?? "all";
  const operationalZoneId = searchParams.get("operationalZoneId") ?? "all";

  const minEstimatedAmount = parsePositiveNumber(
    searchParams.get("minEstimatedAmount"),
  );
  const maxEstimatedAmount = parsePositiveNumber(
    searchParams.get("maxEstimatedAmount"),
  );

  const installationFrom = searchParams.get("installationFrom");
  const installationTo = searchParams.get("installationTo");
  const warrantyFrom = searchParams.get("warrantyFrom");
  const warrantyTo = searchParams.get("warrantyTo");
  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const updatedFrom = searchParams.get("updatedFrom");
  const updatedTo = searchParams.get("updatedTo");

  const columns = sanitizeColumns(searchParams.get("columns"));

  const where: Prisma.InstallationWhereInput = {};

  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { technical_observations: { contains: search, mode: "insensitive" } },
      { technician_name: { contains: search, mode: "insensitive" } },
      { address_line: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { zone: { contains: search, mode: "insensitive" } },
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
        service_type: {
          is: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  if (clientId !== "all" && isUuid(clientId)) {
    where.client_id = clientId;
  }

  if (serviceTypeId !== "all") {
    const parsedServiceTypeId = Number(serviceTypeId);

    if (Number.isInteger(parsedServiceTypeId) && parsedServiceTypeId > 0) {
      where.service_type_id = parsedServiceTypeId;
    }
  }

  if (technicianId === "without") {
    where.technician_id = null;
  } else if (technicianId !== "all" && isUuid(technicianId)) {
    where.technician_id = technicianId;
  }

  if (VALID_INSTALLATION_STATUSES.has(installationStatus)) {
    where.installation_status = installationStatus as InstallationStatus;
  }

  if (VALID_BILLING_STATUSES.has(billingStatus)) {
    where.billing_status = billingStatus as WorkBillingStatus;
  }

  const activeValue = parseBooleanFilter(isActive);
  if (activeValue !== null) {
    where.is_active = activeValue;
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

  if (pendingMaintenance === "with") {
    where.follow_ups = {
      some: {
        completed_at: null,
      },
    };
  }

  if (pendingMaintenance === "without") {
    where.follow_ups = {
      none: {
        completed_at: null,
      },
    };
  }

  if (countryCode !== "all" && countryCode.trim()) {
    where.client = {
      is: {
        country_code: countryCode,
      },
    };
  }

  if (adminLevel1 !== "all" && adminLevel1.trim()) {
    where.admin_level_1 = adminLevel1;
  }

  if (adminLevel2 !== "all" && adminLevel2.trim()) {
    where.admin_level_2 = adminLevel2;
  }

  if (adminLevel3 !== "all" && adminLevel3.trim()) {
    where.admin_level_3 = adminLevel3;
  }

  if (city !== "all" && city.trim()) {
    where.city = city;
  }

  if (zone !== "all" && zone.trim()) {
    where.zone = zone;
  }

  if (operationalZoneId === "without") {
    where.operational_zone_id = null;
  } else if (operationalZoneId !== "all" && isUuid(operationalZoneId)) {
    where.operational_zone_id = operationalZoneId;
  }

  if (minEstimatedAmount !== null || maxEstimatedAmount !== null) {
    where.estimated_amount = {
      ...(minEstimatedAmount !== null ? { gte: minEstimatedAmount } : {}),
      ...(maxEstimatedAmount !== null ? { lte: maxEstimatedAmount } : {}),
    };
  }

  applyDateRange(where, "installation_date", installationFrom, installationTo);
  applyDateRange(where, "warranty_end_date", warrantyFrom, warrantyTo);
  applyDateRange(where, "created_at", createdFrom, createdTo);
  applyDateRange(where, "updated_at", updatedFrom, updatedTo);

  return {
    page,
    pageSize,
    columns,
    where,
  };
}
