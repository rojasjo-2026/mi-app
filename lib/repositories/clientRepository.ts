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

type ClientOperationalSummary = {
  installation_count: number;
  maintenance_count: number;
  pending_maintenance_count: number;
  pending_invoice_count: number;
  last_maintenance: string | null;
  last_contact: string | null;
};

function createEmptyOperationalSummary(): ClientOperationalSummary {
  return {
    installation_count: 0,
    maintenance_count: 0,
    pending_maintenance_count: 0,
    pending_invoice_count: 0,
    last_maintenance: null,
    last_contact: null,
  };
}

function getOperationalSummary(
  summaries: Map<string, ClientOperationalSummary>,
  clientId: string,
) {
  const existingSummary = summaries.get(clientId);

  if (existingSummary) {
    return existingSummary;
  }

  const nextSummary = createEmptyOperationalSummary();
  summaries.set(clientId, nextSummary);

  return nextSummary;
}

async function getClientsOperationalSummaries(clientIds: string[]) {
  const summaries = new Map<string, ClientOperationalSummary>();

  clientIds.forEach((clientId) => {
    summaries.set(clientId, createEmptyOperationalSummary());
  });

  if (clientIds.length === 0) {
    return summaries;
  }

  const [installations, followUps, pendingInvoices, contactAttempts] =
    await Promise.all([
      prisma.installation.findMany({
        where: {
          client_id: {
            in: clientIds,
          },
          is_active: true,
        },
        select: {
          client_id: true,
        },
      }),

      prisma.followUp.findMany({
        where: {
          client_id: {
            in: clientIds,
          },
        },
        select: {
          client_id: true,
          completed_at: true,
        },
      }),

      prisma.invoice.findMany({
        where: {
          client_id: {
            in: clientIds,
          },
          status: {
            in: [
              PrismaInvoiceStatus.PENDING,
              PrismaInvoiceStatus.PARTIALLY_PAID,
              PrismaInvoiceStatus.OVERDUE,
            ],
          },
        },
        select: {
          client_id: true,
        },
      }),

      prisma.contactAttempt.findMany({
        where: {
          client_id: {
            in: clientIds,
          },
        },
        select: {
          client_id: true,
          attempt_datetime: true,
        },
      }),
    ]);

  const lastMaintenanceByClient = new Map<string, Date>();
  const lastContactByClient = new Map<string, Date>();

  installations.forEach((installation) => {
    const summary = getOperationalSummary(summaries, installation.client_id);
    summary.installation_count += 1;
  });

  followUps.forEach((followUp) => {
    const summary = getOperationalSummary(summaries, followUp.client_id);

    summary.maintenance_count += 1;

    if (!followUp.completed_at) {
      summary.pending_maintenance_count += 1;
      return;
    }

    const currentLastMaintenance = lastMaintenanceByClient.get(
      followUp.client_id,
    );

    if (
      !currentLastMaintenance ||
      followUp.completed_at > currentLastMaintenance
    ) {
      lastMaintenanceByClient.set(followUp.client_id, followUp.completed_at);
    }
  });

  pendingInvoices.forEach((invoice) => {
    const summary = getOperationalSummary(summaries, invoice.client_id);
    summary.pending_invoice_count += 1;
  });

  contactAttempts.forEach((contactAttempt) => {
    const currentLastContact = lastContactByClient.get(
      contactAttempt.client_id,
    );

    if (
      !currentLastContact ||
      contactAttempt.attempt_datetime > currentLastContact
    ) {
      lastContactByClient.set(
        contactAttempt.client_id,
        contactAttempt.attempt_datetime,
      );
    }
  });

  lastMaintenanceByClient.forEach((value, clientId) => {
    const summary = getOperationalSummary(summaries, clientId);
    summary.last_maintenance = value.toISOString();
  });

  lastContactByClient.forEach((value, clientId) => {
    const summary = getOperationalSummary(summaries, clientId);
    summary.last_contact = value.toISOString();
  });

  return summaries;
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

  const clientIds = clients.map((client) => client.client_id);
  const operationalSummaries = await getClientsOperationalSummaries(clientIds);

  const enrichedClients = clients.map((client) => ({
    ...client,
    ...(operationalSummaries.get(client.client_id) ??
      createEmptyOperationalSummary()),
  }));

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
