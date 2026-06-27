import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type OperationalZoneInfo = {
  operational_zone_id: string;
  name: string;
  reference_address: string | null;
} | null;

type DecimalLike = {
  toNumber?: () => number;
};

type CalendarEventsServiceParams = {
  startDate?: string;
  endDate?: string;
  countryCode?: string;
};

type DateRangeFilter = {
  gte: Date;
  lt: Date;
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateOnly(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function buildDateRangeFilter(
  params?: CalendarEventsServiceParams,
): DateRangeFilter | null {
  const startDate = params?.startDate ?? params?.endDate;
  const endDate = params?.endDate ?? params?.startDate;

  if (!startDate || !endDate) {
    return null;
  }

  const gte = parseDateOnly(startDate);
  const lt = parseDateOnly(endDate);

  lt.setDate(lt.getDate() + 1);

  return {
    gte,
    lt,
  };
}

function normalizeCountryCode(value: string | undefined) {
  const countryCode = String(value || "")
    .trim()
    .toUpperCase();

  return countryCode || null;
}

function getClientFullName(client: {
  first_name: string;
  last_name_1: string;
}) {
  return `${client.first_name} ${client.last_name_1}`.trim();
}

function decimalToNumber(value: DecimalLike | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value.toNumber === "function") {
    return value.toNumber();
  }

  return null;
}

function getOperationalZonePayload(zone: OperationalZoneInfo) {
  return {
    operational_zone_id: zone?.operational_zone_id ?? null,
    operational_zone_name: zone?.name ?? "Sin agrupación asignada",
    operational_zone_reference_address: zone?.reference_address ?? null,
  };
}

function getBestOperationalZone(
  primaryZone: OperationalZoneInfo,
  fallbackZone?: OperationalZoneInfo,
) {
  return primaryZone ?? fallbackZone ?? null;
}

function buildCoordinateRouteAddress(params: {
  latitude: number | null;
  longitude: number | null;
}) {
  if (params.latitude === null || params.longitude === null) {
    return null;
  }

  return `${params.latitude},${params.longitude}`;
}

function buildFollowUpWhere(params?: CalendarEventsServiceParams) {
  const dateRangeFilter = buildDateRangeFilter(params);
  const countryCode = normalizeCountryCode(params?.countryCode);

  const where: Prisma.FollowUpWhereInput = {};

  if (countryCode) {
    where.client = {
      country_code: countryCode,
    };
  }

  if (dateRangeFilter) {
    where.OR = [
      {
        scheduled_date: {
          not: null,
          gte: dateRangeFilter.gte,
          lt: dateRangeFilter.lt,
        },
      },
      {
        scheduled_date: null,
        target_date: {
          gte: dateRangeFilter.gte,
          lt: dateRangeFilter.lt,
        },
      },
    ];
  }

  return Object.keys(where).length ? where : undefined;
}

function buildInstallationWhere(params?: CalendarEventsServiceParams) {
  const dateRangeFilter = buildDateRangeFilter(params);
  const countryCode = normalizeCountryCode(params?.countryCode);

  const where: Prisma.InstallationWhereInput = {};

  if (countryCode) {
    where.client = {
      country_code: countryCode,
    };
  }

  if (dateRangeFilter) {
    where.installation_date = {
      gte: dateRangeFilter.gte,
      lt: dateRangeFilter.lt,
    };
  }

  return Object.keys(where).length ? where : undefined;
}

export async function getCalendarEventsService(
  params?: CalendarEventsServiceParams,
) {
  const today = new Date();

  const followUpWhere = buildFollowUpWhere(params);
  const installationWhere = buildInstallationWhere(params);

  const followUps = await prisma.followUp.findMany({
    where: followUpWhere,
    select: {
      follow_up_id: true,
      target_date: true,
      scheduled_date: true,
      completed_at: true,
      reason: true,
      priority: true,
      billing_status: true,
      operational_zone_id: true,
      operational_zone: {
        select: {
          operational_zone_id: true,
          name: true,
          reference_address: true,
        },
      },
      client: {
        select: {
          first_name: true,
          last_name_1: true,
          latitude: true,
          longitude: true,
          operational_zone: {
            select: {
              operational_zone_id: true,
              name: true,
              reference_address: true,
            },
          },
        },
      },
      installation: {
        select: {
          latitude: true,
          longitude: true,
          operational_zone: {
            select: {
              operational_zone_id: true,
              name: true,
              reference_address: true,
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
    },
    orderBy: {
      target_date: "asc",
    },
  });

  const installations = await prisma.installation.findMany({
    where: installationWhere,
    select: {
      installation_id: true,
      installation_date: true,
      description: true,
      billing_status: true,
      operational_zone_id: true,
      latitude: true,
      longitude: true,
      operational_zone: {
        select: {
          operational_zone_id: true,
          name: true,
          reference_address: true,
        },
      },
      client: {
        select: {
          first_name: true,
          last_name_1: true,
          latitude: true,
          longitude: true,
          operational_zone: {
            select: {
              operational_zone_id: true,
              name: true,
              reference_address: true,
            },
          },
        },
      },
    },
    orderBy: {
      installation_date: "asc",
    },
  });

  const followUpEvents = followUps
    .filter((followUp) => {
      return followUp.follow_up_status.code !== "completed";
    })
    .map((followUp) => {
      const eventDate = followUp.scheduled_date || followUp.target_date;

      let type: "overdue" | "today" | "upcoming" | "confirmed" | "completed" =
        "upcoming";

      const formattedEventDate = formatDate(eventDate);
      const formattedToday = formatDate(today);

      if (followUp.completed_at) {
        type = "completed";
      } else if (followUp.scheduled_date) {
        type = "confirmed";
      } else if (formattedEventDate < formattedToday) {
        type = "overdue";
      } else if (formattedEventDate === formattedToday) {
        type = "today";
      }

      const clientName = getClientFullName(followUp.client);

      const operationalZone = getBestOperationalZone(
        followUp.operational_zone,
        followUp.installation?.operational_zone ??
          followUp.client.operational_zone,
      );

      const routeLatitude =
        decimalToNumber(followUp.installation?.latitude) ??
        decimalToNumber(followUp.client.latitude);

      const routeLongitude =
        decimalToNumber(followUp.installation?.longitude) ??
        decimalToNumber(followUp.client.longitude);

      const routeAddress =
        buildCoordinateRouteAddress({
          latitude: routeLatitude,
          longitude: routeLongitude,
        }) ??
        operationalZone?.reference_address ??
        null;

      return {
        id: followUp.follow_up_id,
        entity_type: "follow_up",
        follow_up_id: followUp.follow_up_id,
        date: formattedEventDate,
        type,
        title:
          type === "confirmed"
            ? `✅ Mantenimiento confirmado - ${clientName}`
            : `Mantenimiento - ${clientName}`,
        description: followUp.reason || "Mantenimiento programado.",
        status: followUp.follow_up_status.name,
        priority: followUp.priority,
        billing_status: followUp.billing_status,
        is_confirmed: Boolean(followUp.scheduled_date),
        is_completed: Boolean(followUp.completed_at),
        ...getOperationalZonePayload(operationalZone),
        route_latitude: routeLatitude,
        route_longitude: routeLongitude,
        route_address: routeAddress,
      };
    });

  const installationEvents = installations.map((installation) => {
    const clientName = getClientFullName(installation.client);

    const operationalZone = getBestOperationalZone(
      installation.operational_zone,
      installation.client.operational_zone,
    );

    const routeLatitude =
      decimalToNumber(installation.latitude) ??
      decimalToNumber(installation.client.latitude);

    const routeLongitude =
      decimalToNumber(installation.longitude) ??
      decimalToNumber(installation.client.longitude);

    const routeAddress =
      buildCoordinateRouteAddress({
        latitude: routeLatitude,
        longitude: routeLongitude,
      }) ??
      operationalZone?.reference_address ??
      null;

    return {
      id: installation.installation_id,
      entity_type: "installation",
      installation_id: installation.installation_id,
      date: formatDate(installation.installation_date),
      type: "installation" as const,
      title: `Instalación - ${clientName}`,
      description: installation.description || "Instalación registrada.",
      billing_status: installation.billing_status,
      ...getOperationalZonePayload(operationalZone),
      route_latitude: routeLatitude,
      route_longitude: routeLongitude,
      route_address: routeAddress,
    };
  });

  return [...followUpEvents, ...installationEvents];
}
