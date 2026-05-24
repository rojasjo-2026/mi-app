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

function getDayRange(dateValue: Date | string) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error("La fecha no es válida.");
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    date,
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
  const countryCode = normalizeCountryCode(params.country_code);
  const operationalZoneId = normalizeOptionalId(params.operational_zone_id);
  const { startOfDay, endOfDay } = getDayRange(params.date);

  return prisma.installation.count({
    where: {
      is_active: true,
      installation_date: {
        gte: startOfDay,
        lte: endOfDay,
      },
      client: {
        country_code: countryCode,
      },
      ...buildInstallationZoneFilter(operationalZoneId),
    },
  });
}

export async function countFollowUpsForAvailability(
  params: AvailabilityWorkloadQuery,
) {
  const countryCode = normalizeCountryCode(params.country_code);
  const operationalZoneId = normalizeOptionalId(params.operational_zone_id);
  const { startOfDay, endOfDay } = getDayRange(params.date);

  return prisma.followUp.count({
    where: {
      client: {
        country_code: countryCode,
      },
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
      ...buildFollowUpZoneFilter(operationalZoneId),
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
