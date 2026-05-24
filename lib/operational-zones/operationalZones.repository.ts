import { prisma } from "@/lib/prisma";

export type OperationalZoneCreateData = {
  country_code: string;
  name: string;
  description?: string | null;
  reference_address?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  radius_km?: string | number | null;
  color_label?: string | null;
  sort_order?: number | null;
};

export type OperationalZoneUpdateData = Partial<OperationalZoneCreateData> & {
  is_active?: boolean;
};

export type OperationalZoneFilters = {
  country_code?: string;
  active_only?: boolean;
  search?: string;
};

export function findOperationalZones(filters: OperationalZoneFilters) {
  return prisma.operationalZone.findMany({
    where: {
      ...(filters.country_code ? { country_code: filters.country_code } : {}),
      ...(filters.active_only ? { is_active: true } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                name: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                reference_address: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    orderBy: [
      {
        sort_order: "asc",
      },
      {
        name: "asc",
      },
    ],
  });
}

export function findOperationalZoneById(operational_zone_id: string) {
  return prisma.operationalZone.findUnique({
    where: {
      operational_zone_id,
    },
  });
}

export function findOperationalZoneByCountryAndName(params: {
  country_code: string;
  name: string;
}) {
  return prisma.operationalZone.findUnique({
    where: {
      country_code_name: {
        country_code: params.country_code,
        name: params.name,
      },
    },
  });
}

export function createOperationalZone(data: OperationalZoneCreateData) {
  return prisma.operationalZone.create({
    data: {
      country_code: data.country_code,
      name: data.name,
      description: data.description ?? null,
      reference_address: data.reference_address ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      radius_km: data.radius_km ?? null,
      color_label: data.color_label ?? null,
      sort_order: data.sort_order ?? null,
      is_active: true,
    },
  });
}

export function updateOperationalZone(
  operational_zone_id: string,
  data: OperationalZoneUpdateData,
) {
  return prisma.operationalZone.update({
    where: {
      operational_zone_id,
    },
    data: {
      ...(data.country_code !== undefined
        ? { country_code: data.country_code }
        : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.reference_address !== undefined
        ? { reference_address: data.reference_address }
        : {}),
      ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
      ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
      ...(data.radius_km !== undefined ? { radius_km: data.radius_km } : {}),
      ...(data.color_label !== undefined
        ? { color_label: data.color_label }
        : {}),
      ...(data.sort_order !== undefined ? { sort_order: data.sort_order } : {}),
      ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
    },
  });
}

export function deactivateOperationalZone(operational_zone_id: string) {
  return prisma.operationalZone.update({
    where: {
      operational_zone_id,
    },
    data: {
      is_active: false,
    },
  });
}

export function activateOperationalZone(operational_zone_id: string) {
  return prisma.operationalZone.update({
    where: {
      operational_zone_id,
    },
    data: {
      is_active: true,
    },
  });
}

export function deleteOperationalZone(operational_zone_id: string) {
  return prisma.operationalZone.delete({
    where: {
      operational_zone_id,
    },
  });
}
