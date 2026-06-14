import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ReportOption = {
  value: string;
  label: string;
  count?: number;
};

const INSTALLATION_STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  CLOSED: "Cerrada",
  CANCELLED: "Cancelada",
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

const PENDING_INVOICE_STATUSES = [
  "PENDING",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;

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

function getTechnicianName(technician: {
  first_name: string;
  last_name_1: string;
  last_name_2: string | null;
}) {
  return [technician.first_name, technician.last_name_1, technician.last_name_2]
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

export async function GET() {
  try {
    const [
      totalInstallations,
      installationStatusGroups,
      billingStatusGroups,
      isActiveGroups,
      serviceTypeGroups,
      technicianGroups,
      clientGroups,
      adminLevel1Groups,
      adminLevel2Groups,
      adminLevel3Groups,
      cityGroups,
      zoneGroups,
      operationalZoneGroups,
      serviceTypeRows,
      technicianRows,
      clientRows,
      countryRows,
      operationalZoneRows,
      withoutTechnicianCount,
      withoutOperationalZoneCount,
      pendingBillingCount,
      pendingMaintenanceCount,
    ] = await Promise.all([
      prisma.installation.count(),

      prisma.installation.groupBy({
        by: ["installation_status"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["billing_status"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["is_active"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["service_type_id"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["technician_id"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["client_id"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["admin_level_1"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["admin_level_2"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["admin_level_3"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["city"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["zone"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.groupBy({
        by: ["operational_zone_id"],
        _count: {
          _all: true,
        },
      }),

      prisma.installation.findMany({
        distinct: ["service_type_id"],
        select: {
          service_type_id: true,
          service_type: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      }),

      prisma.installation.findMany({
        distinct: ["technician_id"],
        select: {
          technician_id: true,
          technician_name: true,
          technician: {
            select: {
              first_name: true,
              last_name_1: true,
              last_name_2: true,
            },
          },
        },
      }),

      prisma.installation.findMany({
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

      prisma.installation.findMany({
        select: {
          client: {
            select: {
              country_code: true,
            },
          },
        },
      }),

      prisma.installation.findMany({
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

      prisma.installation.count({
        where: {
          technician_id: null,
        },
      }),

      prisma.installation.count({
        where: {
          operational_zone_id: null,
        },
      }),

      prisma.installation.count({
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

      prisma.installation.count({
        where: {
          follow_ups: {
            some: {
              completed_at: null,
            },
          },
        },
      }),
    ]);

    const serviceTypeCountById = new Map<string, number>();

    for (const group of serviceTypeGroups) {
      if (typeof group.service_type_id !== "number") continue;

      serviceTypeCountById.set(
        String(group.service_type_id),
        group._count._all,
      );
    }

    const technicianCountById = new Map<string, number>();

    for (const group of technicianGroups) {
      if (typeof group.technician_id !== "string") continue;

      technicianCountById.set(String(group.technician_id), group._count._all);
    }

    const clientCountById = new Map<string, number>();

    for (const group of clientGroups) {
      clientCountById.set(group.client_id, group._count._all);
    }

    const operationalZoneCountById = new Map<string, number>();

    for (const group of operationalZoneGroups) {
      if (typeof group.operational_zone_id !== "string") continue;

      operationalZoneCountById.set(
        String(group.operational_zone_id),
        group._count._all,
      );
    }

    const installationStatuses: ReportOption[] = installationStatusGroups
      .map((group) => ({
        value: group.installation_status,
        label:
          INSTALLATION_STATUS_LABELS[group.installation_status] ||
          group.installation_status,
        count: group._count._all,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const billingStatuses: ReportOption[] = billingStatusGroups
      .map((group) => ({
        value: group.billing_status,
        label:
          BILLING_STATUS_LABELS[group.billing_status] || group.billing_status,
        count: group._count._all,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const serviceTypes: ReportOption[] = serviceTypeRows
      .filter((row) => typeof row.service_type_id === "number")
      .map((row) => {
        const value = String(row.service_type_id);

        return {
          value,
          label:
            row.service_type?.name ||
            row.service_type?.code ||
            `Tipo de servicio ${value}`,
          count: serviceTypeCountById.get(value) ?? 0,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    const technicians: ReportOption[] = technicianRows
      .filter((row) => typeof row.technician_id === "string")
      .map((row) => {
        const value = String(row.technician_id);

        return {
          value,
          label: row.technician
            ? getTechnicianName(row.technician)
            : row.technician_name || "Técnico sin nombre",
          count: technicianCountById.get(value) ?? 0,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    const clients: ReportOption[] = clientRows
      .map((row) => ({
        value: row.client_id,
        label: getClientName(row.client),
        count: clientCountById.get(row.client_id) ?? 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const countries = mapCountryOptions(
      countryRows.map((row) => row.client.country_code),
    );

    const operationalZones: ReportOption[] = operationalZoneRows
      .filter((row) => typeof row.operational_zone_id === "string")
      .map((row) => {
        const value = String(row.operational_zone_id);

        return {
          value,
          label: row.operational_zone?.name || "Zona operativa sin nombre",
          count: operationalZoneCountById.get(value) ?? 0,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    const isActiveOptions: ReportOption[] = isActiveGroups
      .map((group) => ({
        value: String(group.is_active),
        label: group.is_active ? "Activa" : "Inactiva",
        count: group._count._all,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json({
      success: true,
      source: "installations",
      data: {
        installationStatuses,
        billingStatuses,
        serviceTypes,
        technicians,
        clients,
        countries,

        adminLevel1Options: mapTextGroups(adminLevel1Groups, "admin_level_1"),
        adminLevel2Options: mapTextGroups(adminLevel2Groups, "admin_level_2"),
        adminLevel3Options: mapTextGroups(adminLevel3Groups, "admin_level_3"),
        cityOptions: mapTextGroups(cityGroups, "city"),
        zoneOptions: mapTextGroups(zoneGroups, "zone"),

        operationalZones,

        booleanOptions: {
          isActive: isActiveOptions,
          pendingBilling: [
            {
              value: "with",
              label: "Con facturación pendiente",
              count: pendingBillingCount,
            },
            {
              value: "without",
              label: "Sin facturación pendiente",
              count: Math.max(0, totalInstallations - pendingBillingCount),
            },
          ],
          pendingMaintenance: [
            {
              value: "with",
              label: "Con mantenimiento pendiente",
              count: pendingMaintenanceCount,
            },
            {
              value: "without",
              label: "Sin mantenimiento pendiente",
              count: Math.max(0, totalInstallations - pendingMaintenanceCount),
            },
          ],
        },

        counters: {
          totalInstallations,
          withoutTechnicianCount,
          withoutOperationalZoneCount,
          pendingBillingCount,
          pendingMaintenanceCount,
        },
      },
    });
  } catch (error) {
    console.error("Error loading installation report metadata:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo cargar la metadata de instalaciones",
      },
      { status: 500 },
    );
  }
}
