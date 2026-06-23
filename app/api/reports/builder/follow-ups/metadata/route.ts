import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ACTIVE_CONTACT_FLOW_STATUSES,
  PENDING_INVOICE_STATUSES,
} from "../_lib/constants";

type ReportOption = {
  value: string;
  label: string;
  count?: number;
};

const BILLING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  INVOICED: "Facturada",
  PARTIALLY_PAID: "Parcialmente pagada",
  PAID: "Pagada",
  NOT_BILLABLE: "No facturable",
  BILLING_ERROR: "Error de facturación",
  CANCELLED: "Cancelada",
};

function getClientName(client: {
  display_name: string | null;
  company_name: string | null;
  commercial_name: string | null;
  first_name: string;
  last_name_1: string;
  last_name_2: string | null;
}) {
  const personName = [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    client.display_name ||
    client.commercial_name ||
    client.company_name ||
    personName ||
    "Cliente sin nombre"
  );
}

function getPersonName(person: {
  first_name: string;
  last_name_1: string;
  last_name_2: string | null;
}) {
  return [person.first_name, person.last_name_1, person.last_name_2]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function mapTextGroups<T extends Record<string, unknown>>(
  groups: Array<T & { _count: { _all: number } }>,
  field: keyof T,
): ReportOption[] {
  const options: ReportOption[] = [];

  for (const group of groups) {
    const value = String(group[field] ?? "").trim();

    if (!value) continue;

    options.push({
      value,
      label: value,
      count: group._count._all,
    });
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

function mapCountryOptions(countryValues: Array<string | null>) {
  const counts = new Map<string, number>();

  for (const country of countryValues) {
    const normalizedCountry = String(country ?? "").trim();

    if (!normalizedCountry) continue;

    counts.set(normalizedCountry, (counts.get(normalizedCountry) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function getInstallationLabel(row: {
  installation_id: string;
  installation_date: Date;
  service_type: {
    code: string;
    name: string;
  };
  client: {
    display_name: string | null;
    company_name: string | null;
    commercial_name: string | null;
    first_name: string;
    last_name_1: string;
    last_name_2: string | null;
  };
}) {
  const serviceName = row.service_type.name || row.service_type.code;
  const clientName = getClientName(row.client);

  return `${clientName} - ${serviceName}`;
}

export async function GET() {
  try {
    const today = new Date();

    const [
      totalFollowUps,
      completedCount,
      overdueCount,
      pendingBillingCount,
      contactFlowCount,
      contactAttemptsCount,
      withoutInstallationCount,
      withoutTechnicianCount,
      withoutOperationalZoneCount,

      followUpStatusGroups,
      billingStatusGroups,
      priorityGroups,
      maintenanceTypeGroups,
      createdFromGroups,
      clientGroups,
      installationGroups,
      technicianGroups,
      operationalZoneGroups,

      followUpStatusRows,
      clientRows,
      installationRows,
      technicianRows,
      operationalZoneRows,
      countryRows,
    ] = await Promise.all([
      prisma.followUp.count(),

      prisma.followUp.count({
        where: {
          completed_at: {
            not: null,
          },
        },
      }),

      prisma.followUp.count({
        where: {
          completed_at: null,
          due_date: {
            lt: today,
          },
        },
      }),

      prisma.followUp.count({
        where: {
          invoices: {
            some: {
              status: {
                in: [...PENDING_INVOICE_STATUSES],
              },
              balance_amount: {
                gt: 0,
              },
            },
          },
        },
      }),

      prisma.followUp.count({
        where: {
          maintenance_contact_flows: {
            some: {
              status: {
                in: [...ACTIVE_CONTACT_FLOW_STATUSES],
              },
            },
          },
        },
      }),

      prisma.followUp.count({
        where: {
          contact_attempts: {
            some: {},
          },
        },
      }),

      prisma.followUp.count({
        where: {
          installation_id: null,
        },
      }),

      prisma.followUp.count({
        where: {
          technician_id: null,
        },
      }),

      prisma.followUp.count({
        where: {
          operational_zone_id: null,
        },
      }),

      prisma.followUp.groupBy({
        by: ["follow_up_status_id"],
        _count: {
          _all: true,
        },
      }),

      prisma.followUp.groupBy({
        by: ["billing_status"],
        _count: {
          _all: true,
        },
      }),

      prisma.followUp.groupBy({
        by: ["priority"],
        _count: {
          _all: true,
        },
      }),

      prisma.followUp.groupBy({
        by: ["maintenance_type"],
        _count: {
          _all: true,
        },
      }),

      prisma.followUp.groupBy({
        by: ["created_from"],
        _count: {
          _all: true,
        },
      }),

      prisma.followUp.groupBy({
        by: ["client_id"],
        _count: {
          _all: true,
        },
      }),

      prisma.followUp.groupBy({
        by: ["installation_id"],
        _count: {
          _all: true,
        },
      }),

      prisma.followUp.groupBy({
        by: ["technician_id"],
        _count: {
          _all: true,
        },
      }),

      prisma.followUp.groupBy({
        by: ["operational_zone_id"],
        _count: {
          _all: true,
        },
      }),

      prisma.followUpStatus.findMany({
        where: {
          follow_ups: {
            some: {},
          },
        },
        select: {
          follow_up_status_id: true,
          code: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      prisma.followUp.findMany({
        distinct: ["client_id"],
        select: {
          client_id: true,
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
        },
      }),

      prisma.followUp.findMany({
        distinct: ["installation_id"],
        select: {
          installation_id: true,
          installation: {
            select: {
              installation_id: true,
              installation_date: true,
              service_type: {
                select: {
                  code: true,
                  name: true,
                },
              },
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
            },
          },
        },
      }),

      prisma.followUp.findMany({
        distinct: ["technician_id"],
        select: {
          technician_id: true,
          technician: {
            select: {
              first_name: true,
              last_name_1: true,
              last_name_2: true,
            },
          },
        },
      }),

      prisma.followUp.findMany({
        distinct: ["operational_zone_id"],
        select: {
          operational_zone_id: true,
          operational_zone: {
            select: {
              name: true,
            },
          },
        },
      }),

      prisma.followUp.findMany({
        select: {
          client: {
            select: {
              country_code: true,
            },
          },
        },
      }),
    ]);

    const followUpStatusCountById = new Map<string, number>();

    for (const group of followUpStatusGroups) {
      followUpStatusCountById.set(
        String(group.follow_up_status_id),
        group._count._all,
      );
    }

    const clientCountById = new Map<string, number>();

    for (const group of clientGroups) {
      clientCountById.set(group.client_id, group._count._all);
    }

    const installationCountById = new Map<string, number>();

    for (const group of installationGroups) {
      if (typeof group.installation_id !== "string") continue;

      installationCountById.set(group.installation_id, group._count._all);
    }

    const technicianCountById = new Map<string, number>();

    for (const group of technicianGroups) {
      if (typeof group.technician_id !== "string") continue;

      technicianCountById.set(group.technician_id, group._count._all);
    }

    const operationalZoneCountById = new Map<string, number>();

    for (const group of operationalZoneGroups) {
      if (typeof group.operational_zone_id !== "string") continue;

      operationalZoneCountById.set(
        group.operational_zone_id,
        group._count._all,
      );
    }

    const followUpStatuses: ReportOption[] = followUpStatusRows.map(
      (status) => ({
        value: String(status.follow_up_status_id),
        label: status.name || status.code,
        count:
          followUpStatusCountById.get(String(status.follow_up_status_id)) ?? 0,
      }),
    );

    const billingStatuses: ReportOption[] = billingStatusGroups
      .map((group) => ({
        value: group.billing_status,
        label:
          BILLING_STATUS_LABELS[group.billing_status] || group.billing_status,
        count: group._count._all,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const priorityOptions: ReportOption[] = priorityGroups
      .map((group) => ({
        value: String(group.priority),
        label: `Prioridad ${group.priority}`,
        count: group._count._all,
      }))
      .sort((a, b) => Number(a.value) - Number(b.value));

    const clients: ReportOption[] = clientRows
      .map((row) => ({
        value: row.client_id,
        label: getClientName(row.client),
        count: clientCountById.get(row.client_id) ?? 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const installations: ReportOption[] = installationRows
      .filter(
        (
          row,
        ): row is typeof row & {
          installation_id: string;
          installation: NonNullable<typeof row.installation>;
        } =>
          typeof row.installation_id === "string" && row.installation !== null,
      )
      .map((row) => ({
        value: row.installation_id,
        label: getInstallationLabel(row.installation),
        count: installationCountById.get(row.installation_id) ?? 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const technicians: ReportOption[] = technicianRows
      .filter(
        (
          row,
        ): row is typeof row & {
          technician_id: string;
          technician: NonNullable<typeof row.technician>;
        } => typeof row.technician_id === "string" && row.technician !== null,
      )
      .map((row) => ({
        value: row.technician_id,
        label: getPersonName(row.technician),
        count: technicianCountById.get(row.technician_id) ?? 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const operationalZones: ReportOption[] = operationalZoneRows
      .filter(
        (
          row,
        ): row is typeof row & {
          operational_zone_id: string;
          operational_zone: NonNullable<typeof row.operational_zone>;
        } =>
          typeof row.operational_zone_id === "string" &&
          row.operational_zone !== null,
      )
      .map((row) => ({
        value: row.operational_zone_id,
        label: row.operational_zone.name,
        count: operationalZoneCountById.get(row.operational_zone_id) ?? 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const countries = mapCountryOptions(
      countryRows.map((row) => row.client.country_code),
    );

    return NextResponse.json({
      success: true,
      source: "follow-ups",
      data: {
        followUpStatuses,
        billingStatuses,
        priorityOptions,
        maintenanceTypes: mapTextGroups(
          maintenanceTypeGroups,
          "maintenance_type",
        ),
        createdFromOptions: mapTextGroups(createdFromGroups, "created_from"),
        clients,
        installations,
        technicians,
        operationalZones,
        countries,

        booleanOptions: {
          completionStatus: [
            {
              value: "completed",
              label: "Completados",
              count: completedCount,
            },
            {
              value: "pending",
              label: "Pendientes",
              count: Math.max(0, totalFollowUps - completedCount),
            },
            {
              value: "overdue",
              label: "Vencidos",
              count: overdueCount,
            },
          ],
          pendingBilling: [
            {
              value: "with",
              label: "Con facturación pendiente",
              count: pendingBillingCount,
            },
            {
              value: "without",
              label: "Sin facturación pendiente",
              count: Math.max(0, totalFollowUps - pendingBillingCount),
            },
          ],
          contactFlow: [
            {
              value: "with",
              label: "Con flujo de contacto activo",
              count: contactFlowCount,
            },
            {
              value: "without",
              label: "Sin flujo de contacto activo",
              count: Math.max(0, totalFollowUps - contactFlowCount),
            },
          ],
          contactAttempts: [
            {
              value: "with",
              label: "Con intentos de contacto",
              count: contactAttemptsCount,
            },
            {
              value: "without",
              label: "Sin intentos de contacto",
              count: Math.max(0, totalFollowUps - contactAttemptsCount),
            },
          ],
        },

        counters: {
          totalFollowUps,
          completedCount,
          pendingCount: Math.max(0, totalFollowUps - completedCount),
          overdueCount,
          withoutInstallationCount,
          withoutTechnicianCount,
          withoutOperationalZoneCount,
          pendingBillingCount,
          contactFlowCount,
          contactAttemptsCount,
        },
      },
    });
  } catch (error) {
    console.error("Error loading follow-up report metadata:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo cargar la metadata de mantenimientos",
      },
      { status: 500 },
    );
  }
}
