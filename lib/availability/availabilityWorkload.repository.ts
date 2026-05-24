import { prisma } from "@/lib/prisma";

export type AvailabilityWorkloadQuery = {
  country_code: string;
  date: Date | string;
  operational_zone_id?: string | null;
};

export type AvailabilityWorkloadResult = {
  country_code: string;
  date: Date;
  start_of_day: Date;
  end_of_day: Date;

  total_jobs: number;
  total_installations: number;
  total_maintenances: number;
  has_installation: boolean;

  operational_zone_id: string | null;
};

function normalizeCountryCode(value: string | null | undefined) {
  return String(value || "CR")
    .trim()
    .toUpperCase();
}

function normalizeOptionalId(value: string | null | undefined) {
  const cleanValue = String(value || "").trim();

  return cleanValue || null;
}

function getDateOnlyParts(dateValue: Date | string) {
  const rawValue =
    dateValue instanceof Date
      ? `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(dateValue.getDate()).padStart(2, "0")}`
      : String(dateValue).trim().slice(0, 10);

  const match = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    throw new Error("La fecha no es válida.");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function getDayRange(dateValue: Date | string) {
  const { year, month, day } = getDateOnlyParts(dateValue);

  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  return {
    date: startOfDay,
    startOfDay,
    endOfDay,
  };
}

function buildInstallationZoneFilter(operationalZoneId: string | null) {
  if (!operationalZoneId) {
    return {};
  }

  return {
    operational_zone_id: operationalZoneId,
  };
}

function buildFollowUpZoneFilter(operationalZoneId: string | null) {
  if (!operationalZoneId) {
    return {};
  }

  return {
    OR: [
      {
        operational_zone_id: operationalZoneId,
      },
      {
        installation: {
          operational_zone_id: operationalZoneId,
        },
      },
      {
        client: {
          operational_zone_id: operationalZoneId,
        },
      },
    ],
  };
}

export async function countInstallationsForAvailability(
  params: AvailabilityWorkloadQuery,
) {
  const operationalZoneId = normalizeOptionalId(params.operational_zone_id);
  const { startOfDay, endOfDay } = getDayRange(params.date);

  return prisma.installation.count({
    where: {
      installation_date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      ...buildInstallationZoneFilter(operationalZoneId),
    },
  });
}

export async function countFollowUpsForAvailability(
  params: AvailabilityWorkloadQuery,
) {
  const operationalZoneId = normalizeOptionalId(params.operational_zone_id);
  const { startOfDay, endOfDay } = getDayRange(params.date);
  const zoneFilter = buildFollowUpZoneFilter(operationalZoneId);

  return prisma.followUp.count({
    where: {
      follow_up_status: {
        code: {
          not: "completed",
        },
      },
      AND: [
        {
          OR: [
            {
              scheduled_date: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            {
              scheduled_date: null,
              target_date: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
          ],
        },
        zoneFilter,
      ],
    },
  });
}

export async function getDailyAvailabilityWorkload(
  params: AvailabilityWorkloadQuery,
): Promise<AvailabilityWorkloadResult> {
  const countryCode = normalizeCountryCode(params.country_code);
  const operationalZoneId = normalizeOptionalId(params.operational_zone_id);
  const { date, startOfDay, endOfDay } = getDayRange(params.date);

  const [totalInstallations, totalMaintenances] = await Promise.all([
    countInstallationsForAvailability({
      country_code: countryCode,
      date,
      operational_zone_id: operationalZoneId,
    }),
    countFollowUpsForAvailability({
      country_code: countryCode,
      date,
      operational_zone_id: operationalZoneId,
    }),
  ]);

  return {
    country_code: countryCode,
    date,
    start_of_day: startOfDay,
    end_of_day: endOfDay,

    total_jobs: totalInstallations + totalMaintenances,
    total_installations: totalInstallations,
    total_maintenances: totalMaintenances,
    has_installation: totalInstallations > 0,

    operational_zone_id: operationalZoneId,
  };
}
