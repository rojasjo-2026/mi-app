import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Option = {
  value: string;
  label: string;
  count?: number;
};

const CLIENT_TYPE_LABELS: Record<string, string> = {
  PERSON: "Persona",
  COMPANY: "Empresa",
  OTHER: "Otro",
};

const CLIENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  PROSPECT: "Prospecto",
  ON_HOLD: "En espera",
  INACTIVE: "Inactivo",
};

const PAYMENT_TERM_LABELS: Record<string, string> = {
  CASH: "Contado",
  CREDIT: "Crédito",
};

function cleanValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b, "es"));
}

function toOptions(
  values: Array<string | null | undefined>,
  labels?: Record<string, string>,
): Option[] {
  return cleanValues(values).map((value) => ({
    value,
    label: labels?.[value] ?? value,
  }));
}

function toBooleanOptions(trueCount: number, falseCount: number): Option[] {
  const options: Option[] = [];

  if (trueCount > 0) {
    options.push({
      value: "true",
      label: "Sí",
      count: trueCount,
    });
  }

  if (falseCount > 0) {
    options.push({
      value: "false",
      label: "No",
      count: falseCount,
    });
  }

  return options;
}

export async function GET() {
  try {
    const [
      clientTypes,
      clientStatuses,
      countries,
      adminLevel1Values,
      adminLevel2Values,
      adminLevel3Values,
      paymentTerms,
      currencies,
      operationalZones,
      whatsappTrueCount,
      whatsappFalseCount,
      autoContactTrueCount,
      autoContactFalseCount,
      taxExemptTrueCount,
      taxExemptFalseCount,
      withoutOperationalZoneCount,
    ] = await Promise.all([
      prisma.client.findMany({
        distinct: ["client_type"],
        select: {
          client_type: true,
        },
      }),

      prisma.client.findMany({
        distinct: ["client_status"],
        select: {
          client_status: true,
        },
      }),

      prisma.client.findMany({
        distinct: ["country_code"],
        select: {
          country_code: true,
        },
      }),

      prisma.client.findMany({
        where: {
          admin_level_1: {
            not: null,
          },
        },
        distinct: ["admin_level_1"],
        select: {
          admin_level_1: true,
        },
      }),

      prisma.client.findMany({
        where: {
          admin_level_2: {
            not: null,
          },
        },
        distinct: ["admin_level_2"],
        select: {
          admin_level_2: true,
        },
      }),

      prisma.client.findMany({
        where: {
          admin_level_3: {
            not: null,
          },
        },
        distinct: ["admin_level_3"],
        select: {
          admin_level_3: true,
        },
      }),

      prisma.client.findMany({
        distinct: ["default_payment_term"],
        select: {
          default_payment_term: true,
        },
      }),

      prisma.client.findMany({
        distinct: ["preferred_currency"],
        select: {
          preferred_currency: true,
        },
      }),

      prisma.operationalZone.findMany({
        where: {
          is_active: true,
        },
        orderBy: [
          {
            sort_order: "asc",
          },
          {
            name: "asc",
          },
        ],
        select: {
          operational_zone_id: true,
          name: true,
        },
      }),

      prisma.client.count({
        where: {
          whatsapp_opt_in: true,
        },
      }),

      prisma.client.count({
        where: {
          whatsapp_opt_in: false,
        },
      }),

      prisma.client.count({
        where: {
          auto_contact_enabled: true,
        },
      }),

      prisma.client.count({
        where: {
          auto_contact_enabled: false,
        },
      }),

      prisma.client.count({
        where: {
          tax_exempt: true,
        },
      }),

      prisma.client.count({
        where: {
          tax_exempt: false,
        },
      }),

      prisma.client.count({
        where: {
          operational_zone_id: null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        clientTypes: toOptions(
          clientTypes.map((item) => item.client_type),
          CLIENT_TYPE_LABELS,
        ),
        clientStatuses: toOptions(
          clientStatuses.map((item) => item.client_status),
          CLIENT_STATUS_LABELS,
        ),
        countries: toOptions(countries.map((item) => item.country_code)),
        adminLevel1Options: toOptions(
          adminLevel1Values.map((item) => item.admin_level_1),
        ),
        adminLevel2Options: toOptions(
          adminLevel2Values.map((item) => item.admin_level_2),
        ),
        adminLevel3Options: toOptions(
          adminLevel3Values.map((item) => item.admin_level_3),
        ),
        paymentTerms: toOptions(
          paymentTerms.map((item) => item.default_payment_term),
          PAYMENT_TERM_LABELS,
        ),
        currencies: toOptions(
          currencies.map((item) => item.preferred_currency),
        ),
        operationalZones: operationalZones.map((zone) => ({
          value: zone.operational_zone_id,
          label: zone.name,
        })),
        booleanOptions: {
          whatsapp: toBooleanOptions(whatsappTrueCount, whatsappFalseCount),
          autoContact: toBooleanOptions(
            autoContactTrueCount,
            autoContactFalseCount,
          ),
          taxExempt: toBooleanOptions(taxExemptTrueCount, taxExemptFalseCount),
        },
        counters: {
          withoutOperationalZoneCount,
        },
      },
    });
  } catch (error) {
    console.error("Error loading report builder metadata:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo cargar la metadata de reportes",
      },
      { status: 500 },
    );
  }
}
