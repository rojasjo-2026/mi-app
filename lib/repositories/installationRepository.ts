import { InstallationStatus, WorkBillingStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export type FindInstallationsParams = {
  search?: string;
  client_id?: string;
  status?: string;
  zone?: string;
  admin_level_1?: string;
  admin_level_2?: string;
  admin_level_3?: string;
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
  const {
    search,
    client_id,
    status,
    zone,
    admin_level_1,
    admin_level_2,
    admin_level_3,
  } = params;

  const where: Prisma.InstallationWhereInput = {
    is_active: true,

    ...(client_id ? { client_id } : {}),
    ...(isInstallationStatus(status) ? { installation_status: status } : {}),
    ...(zone ? { zone: { contains: zone, mode: "insensitive" } } : {}),
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

  return prisma.installation.findMany({
    where,
    include: installationBaseInclude,
    orderBy: {
      installation_date: "desc",
    },
  });
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
