import { prisma } from "@/lib/prisma";

export type OperationalZoneVisitDateCreateData = {
  operational_zone_id: string;
  visit_date: Date;
};

export type OperationalZoneVisitDateUpdateData = {
  is_active?: boolean;
};

export type OperationalZoneVisitDateFilters = {
  operational_zone_id: string;
  active_only?: boolean;
  from_date?: Date;
  to_date?: Date;
};

export function findOperationalZoneVisitDates(
  filters: OperationalZoneVisitDateFilters,
) {
  return prisma.operationalZoneVisitDate.findMany({
    where: {
      operational_zone_id: filters.operational_zone_id,

      ...(filters.active_only ? { is_active: true } : {}),

      ...(filters.from_date || filters.to_date
        ? {
            visit_date: {
              ...(filters.from_date ? { gte: filters.from_date } : {}),
              ...(filters.to_date ? { lte: filters.to_date } : {}),
            },
          }
        : {}),
    },

    orderBy: [
      {
        visit_date: "asc",
      },
      {
        created_at: "asc",
      },
    ],
  });
}

export function findOperationalZoneVisitDateById(
  operational_zone_visit_date_id: string,
) {
  return prisma.operationalZoneVisitDate.findUnique({
    where: {
      operational_zone_visit_date_id,
    },
  });
}

export function findOperationalZoneVisitDateByIdAndZone(params: {
  operational_zone_visit_date_id: string;
  operational_zone_id: string;
}) {
  return prisma.operationalZoneVisitDate.findFirst({
    where: {
      operational_zone_visit_date_id: params.operational_zone_visit_date_id,
      operational_zone_id: params.operational_zone_id,
    },
  });
}

export function findOperationalZoneVisitDateByZoneAndDate(params: {
  operational_zone_id: string;
  visit_date: Date;
}) {
  return prisma.operationalZoneVisitDate.findUnique({
    where: {
      operational_zone_id_visit_date: {
        operational_zone_id: params.operational_zone_id,
        visit_date: params.visit_date,
      },
    },
  });
}

export function createOperationalZoneVisitDate(
  data: OperationalZoneVisitDateCreateData,
) {
  return prisma.operationalZoneVisitDate.create({
    data: {
      operational_zone_id: data.operational_zone_id,
      visit_date: data.visit_date,
      is_active: true,
    },
  });
}

export function updateOperationalZoneVisitDate(
  operational_zone_visit_date_id: string,
  data: OperationalZoneVisitDateUpdateData,
) {
  return prisma.operationalZoneVisitDate.update({
    where: {
      operational_zone_visit_date_id,
    },
    data: {
      ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
    },
  });
}

export function activateOperationalZoneVisitDate(
  operational_zone_visit_date_id: string,
) {
  return prisma.operationalZoneVisitDate.update({
    where: {
      operational_zone_visit_date_id,
    },
    data: {
      is_active: true,
    },
  });
}

export function deactivateOperationalZoneVisitDate(
  operational_zone_visit_date_id: string,
) {
  return prisma.operationalZoneVisitDate.update({
    where: {
      operational_zone_visit_date_id,
    },
    data: {
      is_active: false,
    },
  });
}

export function deleteOperationalZoneVisitDate(
  operational_zone_visit_date_id: string,
) {
  return prisma.operationalZoneVisitDate.delete({
    where: {
      operational_zone_visit_date_id,
    },
  });
}
