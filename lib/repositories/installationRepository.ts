import { InstallationStatus, WorkBillingStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { normalizeCountryCode } from "@/lib/settings/appSettingsUtils";

const clientNameSelect = {
  client_id: true,
  first_name: true,
  last_name_1: true,
  last_name_2: true,
  phone_primary: true,
  email: true,
} as const;

const installationBaseInclude = {
  client: {
    select: clientNameSelect,
  },
  service_type: true,
  technician: true,
} as const;

const installationDetailInclude = {
  ...installationBaseInclude,
  follow_ups: {
    orderBy: {
      target_date: "asc" as const,
    },
  },
  change_logs: {
    orderBy: {
      changed_at: "desc" as const,
    },
  },
} as const;

export type UpdateInstallationData = Partial<{
  client_id: string;
  service_type_id: number;
  installation_date: Date;
  description: string | null;
  technical_observations: string | null;
  estimated_amount: number | null;
  final_amount: number | null;
  cost_amount: number | null;
  warranty_months: number | null;
  warranty_end_date: Date | null;
  technician_name: string | null;
  technician_id: string | null;
  address_line: string | null;
  zone: string | null;
  operational_zone_id: string | null;
  city: string | null;
  admin_level_1: string | null;
  admin_level_2: string | null;
  admin_level_3: string | null;
  latitude: number | null;
  longitude: number | null;
  location_notes: string | null;
  reference_point: string | null;
  installation_status: InstallationStatus;
  is_active: boolean;
  billing_status: WorkBillingStatus;
  billing_notes: string | null;
  billing_block_reason: string | null;
}>;

export type CreateInstallationData = {
  client_id: string;
  service_type_id: number;
  installation_date: Date;
  description: string | null;
  technical_observations: string | null;
  estimated_amount: number | null;
  final_amount: number | null;
  cost_amount: number | null;
  warranty_months: number | null;
  warranty_end_date: Date | null;
  technician_name: string | null;
  technician_id: string | null;
  address_line: string | null;
  zone: string | null;
  operational_zone_id: string | null;
  city: string | null;
  admin_level_1: string | null;
  admin_level_2: string | null;
  admin_level_3: string | null;
  latitude: number | null;
  longitude: number | null;
  location_notes: string | null;
  reference_point: string | null;
  installation_status: InstallationStatus;
  is_active: boolean;
  billing_status: WorkBillingStatus;
  billing_notes: string | null;
  billing_block_reason: string | null;
};

export type InstallationSortKey =
  | "installation"
  | "client"
  | "service"
  | "date"
  | "technician"
  | "location"
  | "amount"
  | "status";

export type SortDirection = "asc" | "desc";

export type FindInstallationsParams = {
  country_code?: string;
  search?: string;
  client_id?: string;
  status?: string;
  zone?: string;
  operational_zone_id?: string;
  admin_level_1?: string;
  admin_level_2?: string;
  admin_level_3?: string;
  page?: number;
  pageSize?: number;
  sortKey?: InstallationSortKey;
  sortDirection?: SortDirection;
};

function isInstallationStatus(
  value: string | undefined,
): value is InstallationStatus {
  if (!value) {
    return false;
  }

  return Object.values(InstallationStatus).includes(
    value as InstallationStatus,
  );
}

function normalizePaginationValue(value: number | undefined, fallback: number) {
  if (!value || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

function getInstallationOrderBy(
  sortKey: InstallationSortKey | undefined,
  sortDirection: SortDirection | undefined,
): Prisma.InstallationOrderByWithRelationInput {
  const direction = sortDirection === "asc" ? "asc" : "desc";

  if (sortKey === "installation") {
    return { description: direction };
  }

  if (sortKey === "client") {
    return { client: { first_name: direction } };
  }

  if (sortKey === "service") {
    return { service_type: { name: direction } };
  }

  if (sortKey === "technician") {
    return { technician_name: direction };
  }

  if (sortKey === "location") {
    return { city: direction };
  }

  if (sortKey === "amount") {
    return { estimated_amount: direction };
  }

  if (sortKey === "status") {
    return { installation_status: direction };
  }

  return { installation_date: direction };
}

function buildInstallationWhere(
  params: FindInstallationsParams,
  options?: { includeStatus?: boolean },
): Prisma.InstallationWhereInput {
  const {
    country_code,
    search,
    client_id,
    status,
    zone,
    operational_zone_id,
    admin_level_1,
    admin_level_2,
    admin_level_3,
  } = params;

  const includeStatus = options?.includeStatus ?? true;

  const countryCode = country_code
    ? normalizeCountryCode(country_code)
    : undefined;

  const where: Prisma.InstallationWhereInput = {
    is_active: true,

    ...(countryCode
      ? {
          client: {
            is: {
              country_code: countryCode,
            },
          },
        }
      : {}),
    ...(client_id ? { client_id } : {}),
    ...(includeStatus && isInstallationStatus(status)
      ? { installation_status: status }
      : {}),
    ...(zone ? { zone: { contains: zone, mode: "insensitive" } } : {}),
    ...(operational_zone_id ? { operational_zone_id } : {}),
    ...(admin_level_1
      ? {
          admin_level_1: {
            contains: admin_level_1,
            mode: "insensitive",
          },
        }
      : {}),
    ...(admin_level_2
      ? {
          admin_level_2: {
            contains: admin_level_2,
            mode: "insensitive",
          },
        }
      : {}),
    ...(admin_level_3
      ? {
          admin_level_3: {
            contains: admin_level_3,
            mode: "insensitive",
          },
        }
      : {}),
  };

  if (search) {
    where.OR = [
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        technician_name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        address_line: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        city: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        admin_level_1: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        admin_level_2: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        admin_level_3: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        zone: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        service_type: {
          is: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        client: {
          is: {
            OR: [
              {
                first_name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                last_name_1: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                last_name_2: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                phone_primary: {
                  contains: search,
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      },
    ];
  }

  return where;
}

export async function findInstallationById(id: string) {
  return prisma.installation.findUnique({
    where: { installation_id: id },
    include: installationDetailInclude,
  });
}

export async function updateInstallation(
  id: string,
  data: UpdateInstallationData,
) {
  return prisma.installation.update({
    where: { installation_id: id },
    data,
    include: installationBaseInclude,
  });
}

export async function createInstallation(data: CreateInstallationData) {
  return prisma.installation.create({
    data,
    include: installationBaseInclude,
  });
}

export async function findInstallations(params: FindInstallationsParams) {
  const page = normalizePaginationValue(params.page, 1);
  const pageSize = Math.min(normalizePaginationValue(params.pageSize, 25), 100);
  const skip = (page - 1) * pageSize;
  const where = buildInstallationWhere(params);
  const metricsWhere = buildInstallationWhere(params, { includeStatus: false });
  const orderBy = getInstallationOrderBy(params.sortKey, params.sortDirection);

  const [data, totalItems, total, open, inProgress, closed, cancelled] =
    await Promise.all([
      prisma.installation.findMany({
        where,
        include: installationBaseInclude,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.installation.count({ where }),
      prisma.installation.count({ where: metricsWhere }),
      prisma.installation.count({
        where: {
          ...metricsWhere,
          installation_status: InstallationStatus.OPEN,
        },
      }),
      prisma.installation.count({
        where: {
          ...metricsWhere,
          installation_status: InstallationStatus.IN_PROGRESS,
        },
      }),
      prisma.installation.count({
        where: {
          ...metricsWhere,
          installation_status: InstallationStatus.CLOSED,
        },
      }),
      prisma.installation.count({
        where: {
          ...metricsWhere,
          installation_status: InstallationStatus.CANCELLED,
        },
      }),
    ]);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
    metrics: {
      total,
      open,
      inProgress,
      closed,
      cancelled,
    },
  };
}

export async function findClientById(client_id: string) {
  return prisma.client.findUnique({
    where: { client_id },
    select: { client_id: true },
  });
}

export async function findServiceTypeById(service_type_id: number) {
  return prisma.serviceType.findUnique({
    where: { service_type_id },
    select: { service_type_id: true },
  });
}
