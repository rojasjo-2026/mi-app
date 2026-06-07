import {
  ClientStatus as PrismaClientStatus,
  InvoiceStatus as PrismaInvoiceStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  normalizeClientStatus,
  normalizeClientStatusFilter,
  type ClientStatus,
} from "@/lib/clients/clientStatus";

type ClientStatusInput = ClientStatus | string | null | undefined;

export type FindClientsSortKey =
  | "client"
  | "contact"
  | "location"
  | "operation"
  | "activity"
  | "status";

export type FindClientsSortDirection = "asc" | "desc";

export type FindClientsWhatsAppFilter = "all" | "with" | "without";

type FindClientsParams = {
  search?: string;
  status?: ClientStatusInput;
  whatsapp?: FindClientsWhatsAppFilter | string | null;
  page?: number;
  pageSize?: number;
  sortKey?: FindClientsSortKey | string | null;
  sortDirection?: FindClientsSortDirection | string | null;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function getSafePage(value?: number) {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return DEFAULT_PAGE;
  }

  return Math.floor(value);
}

function getSafePageSize(value?: number) {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}

function getSortDirection(
  value?: FindClientsSortDirection | string | null,
): FindClientsSortDirection {
  return value === "desc" ? "desc" : "asc";
}

function getClientOrderBy(
  sortKey?: FindClientsSortKey | string | null,
  sortDirection?: FindClientsSortDirection | string | null,
): Prisma.ClientOrderByWithRelationInput[] {
  const direction = getSortDirection(sortDirection);

  switch (sortKey) {
    case "client":
      return [
        { display_name: direction },
        { first_name: direction },
        { last_name_1: direction },
      ];

    case "contact":
      return [{ phone_primary: direction }, { email: direction }];

    case "location":
      return [
        { admin_level_1: direction },
        { admin_level_2: direction },
        { admin_level_3: direction },
      ];

    case "status":
      return [{ client_status: direction }, { display_name: "asc" }];

    case "activity":
      return [{ updated_at: direction }, { created_at: direction }];

    case "operation":
      return [{ updated_at: direction }, { created_at: direction }];

    default:
      return [{ created_at: "desc" }];
  }
}

type ClientType = "PERSON" | "COMPANY" | "OTHER";

type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";

export type CreateClientData = {
  client_type?: ClientType;
  compliance_profile?: ClientComplianceProfile;

  display_name?: string | null;
  legal_name?: string | null;
  company_name?: string | null;
  commercial_name?: string | null;
  main_contact_name?: string | null;

  identification_country?: string;
  identification_type?: string | null;
  identification_number?: string | null;

  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;

  phone_primary: string;
  phone_secondary?: string | null;
  email?: string | null;

  country_code?: string;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;

  address_line?: string | null;
  reference_point?: string | null;
  location_notes?: string | null;
  zone?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;

  client_status?: ClientStatusInput;

  whatsapp_opt_in?: boolean;
  whatsapp_opt_in_at?: Date | string | null;

  auto_contact_enabled?: boolean;
  maintenance_contact_days_before?: number | null;

  default_payment_term?: "CASH" | "CREDIT";
  default_credit_days?: number | null;
  default_discount_rate?: number | string | null;
  credit_limit?: number | string | null;

  billing_same_as_client?: boolean;
  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: string | null;

  tax_id?: string | null;
  tax_exempt?: boolean;
  preferred_currency?: "CRC" | "USD";

  data_consent_at?: Date | string | null;
  data_consent_source?: string | null;
};

export type UpdateClientData = Partial<{
  client_type: ClientType;
  compliance_profile: ClientComplianceProfile;

  display_name: string | null;
  legal_name: string | null;
  company_name: string | null;
  commercial_name: string | null;
  main_contact_name: string | null;

  identification_country: string;
  identification_type: string | null;
  identification_number: string | null;

  first_name: string;
  last_name_1: string;
  last_name_2: string | null;

  phone_primary: string;
  phone_secondary: string | null;
  email: string | null;

  country_code: string;
  admin_level_1: string | null;
  admin_level_2: string | null;
  admin_level_3: string | null;

  address_line: string | null;
  reference_point: string | null;
  location_notes: string | null;
  zone: string | null;
  latitude: number | string | null;
  longitude: number | string | null;

  client_status: ClientStatusInput;

  whatsapp_opt_in: boolean;
  whatsapp_opt_in_at: Date | string | null;

  auto_contact_enabled: boolean;
  maintenance_contact_days_before: number | null;

  default_payment_term: "CASH" | "CREDIT";
  default_credit_days: number | null;
  default_discount_rate: number | string | null;
  credit_limit: number | string | null;

  billing_same_as_client: boolean;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  billing_address: string | null;

  tax_id: string | null;
  tax_exempt: boolean;
  preferred_currency: "CRC" | "USD";

  data_consent_at: Date | string | null;
  data_consent_source: string | null;
}>;

function shouldReturnAllStatuses(status: ClientStatusInput) {
  return normalizeClientStatusFilter(status) === "all";
}

async function getClientOperationalSummary(clientId: string) {
  const [
    installationCount,
    maintenanceCount,
    pendingMaintenanceCount,
    pendingInvoiceCount,
    lastMaintenance,
    lastContact,
  ] = await prisma.$transaction([
    prisma.installation.count({
      where: {
        client_id: clientId,
        is_active: true,
      },
    }),

    prisma.followUp.count({
      where: {
        client_id: clientId,
      },
    }),

    prisma.followUp.count({
      where: {
        client_id: clientId,
        completed_at: null,
      },
    }),

    prisma.invoice.count({
      where: {
        client_id: clientId,
        status: {
          in: [
            PrismaInvoiceStatus.PENDING,
            PrismaInvoiceStatus.PARTIALLY_PAID,
            PrismaInvoiceStatus.OVERDUE,
          ],
        },
      },
    }),

    prisma.followUp.findFirst({
      where: {
        client_id: clientId,
        completed_at: {
          not: null,
        },
      },
      orderBy: {
        completed_at: "desc",
      },
      select: {
        completed_at: true,
      },
    }),

    prisma.contactAttempt.findFirst({
      where: {
        client_id: clientId,
      },
      orderBy: {
        attempt_datetime: "desc",
      },
      select: {
        attempt_datetime: true,
      },
    }),
  ]);

  return {
    installation_count: installationCount,
    maintenance_count: maintenanceCount,
    pending_maintenance_count: pendingMaintenanceCount,
    pending_invoice_count: pendingInvoiceCount,
    last_maintenance: lastMaintenance?.completed_at
      ? lastMaintenance.completed_at.toISOString()
      : null,
    last_contact: lastContact?.attempt_datetime
      ? lastContact.attempt_datetime.toISOString()
      : null,
  };
}

export async function findClients({
  search,
  status,
  whatsapp = "all",
  page,
  pageSize,
  sortKey = "client",
  sortDirection = "asc",
}: FindClientsParams) {
  const normalizedStatus = normalizeClientStatus(status);
  const safePage = getSafePage(page);
  const safePageSize = getSafePageSize(pageSize);
  const skip = (safePage - 1) * safePageSize;

  const where: Prisma.ClientWhereInput = {
    ...(shouldReturnAllStatuses(status)
      ? {}
      : {
          client_status: normalizedStatus ?? PrismaClientStatus.ACTIVE,
        }),

    ...(whatsapp === "with"
      ? { whatsapp_opt_in: true }
      : whatsapp === "without"
        ? { whatsapp_opt_in: false }
        : {}),

    ...(search
      ? {
          OR: [
            { display_name: { contains: search, mode: "insensitive" } },
            { legal_name: { contains: search, mode: "insensitive" } },
            { company_name: { contains: search, mode: "insensitive" } },
            { commercial_name: { contains: search, mode: "insensitive" } },
            { main_contact_name: { contains: search, mode: "insensitive" } },

            { first_name: { contains: search, mode: "insensitive" } },
            { last_name_1: { contains: search, mode: "insensitive" } },
            { last_name_2: { contains: search, mode: "insensitive" } },

            { phone_primary: { contains: search } },
            { phone_secondary: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },

            { admin_level_1: { contains: search, mode: "insensitive" } },
            { admin_level_2: { contains: search, mode: "insensitive" } },
            { admin_level_3: { contains: search, mode: "insensitive" } },
            { address_line: { contains: search, mode: "insensitive" } },
            { zone: { contains: search, mode: "insensitive" } },

            { billing_name: { contains: search, mode: "insensitive" } },
            { billing_email: { contains: search, mode: "insensitive" } },
            { billing_phone: { contains: search } },

            { tax_id: { contains: search } },
            { identification_number: { contains: search } },
          ],
        }
      : {}),
  };

  const [totalItems, activeCount, withWhatsAppCount, attentionCount, clients] =
    await prisma.$transaction([
      prisma.client.count({ where }),
      prisma.client.count({
        where: {
          AND: [where, { client_status: PrismaClientStatus.ACTIVE }],
        },
      }),
      prisma.client.count({
        where: {
          AND: [where, { whatsapp_opt_in: true }],
        },
      }),
      prisma.client.count({
        where: {
          AND: [
            where,
            {
              client_status: {
                in: [PrismaClientStatus.ON_HOLD, PrismaClientStatus.INACTIVE],
              },
            },
          ],
        },
      }),
      prisma.client.findMany({
        where,
        skip,
        take: safePageSize,
        orderBy: getClientOrderBy(sortKey, sortDirection),
      }),
    ]);

  const enrichedClients = await Promise.all(
    clients.map(async (client) => {
      const operationalSummary = await getClientOperationalSummary(
        client.client_id,
      );

      return {
        ...client,
        ...operationalSummary,
      };
    }),
  );

  return {
    data: enrichedClients,
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / safePageSize)),
    },
    metrics: {
      total: totalItems,
      active: activeCount,
      withWhatsApp: withWhatsAppCount,
      attention: attentionCount,
    },
  };
}

export async function findClientById(id: string) {
  return prisma.client.findUnique({
    where: {
      client_id: id,
    },
    include: {
      installations: {
        include: {
          service_type: true,
          follow_ups: {
            include: {
              follow_up_status: true,
            },
            orderBy: {
              target_date: "asc",
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      },
    },
  });
}

export async function createClient(data: CreateClientData) {
  const normalizedStatus =
    normalizeClientStatus(data.client_status) ?? PrismaClientStatus.ACTIVE;

  return prisma.client.create({
    data: {
      ...data,
      client_status: normalizedStatus,
    },
  });
}

export async function updateClient(id: string, data: UpdateClientData) {
  const { client_status: clientStatusInput, ...restData } = data;

  const normalizedStatus = normalizeClientStatus(clientStatusInput);

  const updateData: Prisma.ClientUpdateInput = {
    ...restData,
    ...(clientStatusInput !== undefined && normalizedStatus
      ? {
          client_status: normalizedStatus,
        }
      : {}),
  };

  return prisma.client.update({
    where: {
      client_id: id,
    },
    data: updateData,
  });
}
