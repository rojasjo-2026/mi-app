import { prisma } from "@/lib/prisma";

type FindClientsParams = {
  search?: string;
  status?: string;
};

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

  client_status?: string;

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

  client_status: string;

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

export async function findClients({ search, status }: FindClientsParams) {
  return prisma.client.findMany({
    where: {
      client_status: status || "active",
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

              { billing_name: { contains: search, mode: "insensitive" } },
              { billing_email: { contains: search, mode: "insensitive" } },
              { billing_phone: { contains: search } },

              { tax_id: { contains: search } },
              { identification_number: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { created_at: "desc" },
  });
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
  return prisma.client.create({
    data,
  });
}

export async function updateClient(id: string, data: UpdateClientData) {
  return prisma.client.update({
    where: {
      client_id: id,
    },
    data,
  });
}
