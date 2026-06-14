import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOrCreateAppSettingsService } from "@/lib/services/settingsService";
import { recordContactFlowCreatedActivitySafely } from "@/lib/services/whatsapp/whatsappActivityLogService";

export const contactFlowInclude = {
  client: true,
  installation: true,
  follow_up: {
    include: {
      follow_up_status: true,
    },
  },
  messages: {
    orderBy: {
      created_at: "desc" as const,
    },
    take: 10,
  },
} as const;

type ContactFlowWithRelations = Prisma.MaintenanceContactFlowGetPayload<{
  include: typeof contactFlowInclude;
}>;

export type ContactFlowFilter =
  | "all"
  | "unread"
  | "waiting"
  | "confirmed"
  | "manual";

export type ContactFlowSortKey =
  | "client"
  | "installation"
  | "status"
  | "risk"
  | "targetDate"
  | "selectedDate"
  | "lastInteraction";

export type SortDirection = "asc" | "desc";

export type ContactFlowListParams = {
  followUpId: string | null;
  page: number;
  pageSize: number;
  filter: ContactFlowFilter;
  sortKey: ContactFlowSortKey;
  sortDirection: SortDirection;
};

export function mapContactFlow(flow: ContactFlowWithRelations) {
  const unreadMessages = flow.messages.filter(
    (message) => message.direction === "INBOUND",
  );

  return {
    contact_flow_id: flow.contact_flow_id,
    status: flow.status,
    trigger_date: flow.trigger_date,
    selected_date: flow.selected_date,
    first_message_sent_at: flow.first_message_sent_at,
    last_message_at: flow.last_message_at,
    requires_manual_action: flow.requires_manual_action,
    manual_reason: flow.manual_reason,
    unread_count: unreadMessages.length,
    has_unread_messages: unreadMessages.length > 0,
    client: {
      client_id: flow.client.client_id,
      first_name: flow.client.first_name,
      last_name_1: flow.client.last_name_1,
      last_name_2: flow.client.last_name_2,
      phone_primary: flow.client.phone_primary,
    },
    installation: flow.installation
      ? {
          installation_id: flow.installation.installation_id,
          description: flow.installation.description,
        }
      : null,
    follow_up: {
      follow_up_id: flow.follow_up.follow_up_id,
      target_date: flow.follow_up.target_date,
      scheduled_date: flow.follow_up.scheduled_date,
      reason: flow.follow_up.reason,
      priority: flow.follow_up.priority,
      follow_up_status: flow.follow_up.follow_up_status,
    },
    last_message: flow.messages[0]
      ? {
          message_id: flow.messages[0].message_id,
          direction: flow.messages[0].direction,
          message_text: flow.messages[0].message_text,
          message_type: flow.messages[0].message_type,
          delivery_status: flow.messages[0].delivery_status,
          metadata: flow.messages[0].metadata,
          created_at: flow.messages[0].created_at,
          sent_at: flow.messages[0].sent_at,
          received_at: flow.messages[0].received_at,
        }
      : null,
  };
}

export function normalizePositiveInteger(
  value: string | null,
  fallback: number,
) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

export function normalizeFilter(value: string | null): ContactFlowFilter {
  if (
    value === "unread" ||
    value === "waiting" ||
    value === "confirmed" ||
    value === "manual"
  ) {
    return value;
  }

  return "all";
}

export function normalizeSortKey(value: string | null): ContactFlowSortKey {
  if (
    value === "client" ||
    value === "installation" ||
    value === "status" ||
    value === "risk" ||
    value === "targetDate" ||
    value === "selectedDate" ||
    value === "lastInteraction"
  ) {
    return value;
  }

  return "lastInteraction";
}

export function normalizeSortDirection(value: string | null): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

function buildContactFlowWhere(params: {
  followUpId?: string | null;
  filter?: ContactFlowFilter;
}) {
  const where: Prisma.MaintenanceContactFlowWhereInput = {
    ...(params.followUpId ? { follow_up_id: params.followUpId } : {}),
  };

  if (params.filter === "unread") {
    where.messages = {
      some: {
        direction: "INBOUND",
      },
    };
  }

  if (params.filter === "waiting") {
    where.status = {
      in: ["WAITING_RESPONSE", "OPTIONS_SENT"],
    };
  }

  if (params.filter === "confirmed") {
    where.status = "CONFIRMED";
  }

  if (params.filter === "manual") {
    where.status = "MANUAL_REQUIRED";
  }

  return where;
}

function buildContactFlowOrderBy(
  sortKey: ContactFlowSortKey,
  sortDirection: SortDirection,
): Prisma.MaintenanceContactFlowOrderByWithRelationInput[] {
  const direction = sortDirection === "asc" ? "asc" : "desc";

  if (sortKey === "client") {
    return [
      { client: { first_name: direction } },
      { client: { last_name_1: direction } },
      { updated_at: "desc" },
    ];
  }

  if (sortKey === "installation") {
    return [
      { installation: { description: direction } },
      { updated_at: "desc" },
    ];
  }

  if (sortKey === "status") {
    return [{ status: direction }, { updated_at: "desc" }];
  }

  if (sortKey === "risk") {
    return [{ requires_manual_action: direction }, { status: direction }];
  }

  if (sortKey === "targetDate") {
    return [{ follow_up: { target_date: direction } }, { updated_at: "desc" }];
  }

  if (sortKey === "selectedDate") {
    return [{ selected_date: direction }, { updated_at: "desc" }];
  }

  return [{ last_message_at: direction }, { updated_at: "desc" }];
}

export async function getContactFlows(params: ContactFlowListParams) {
  const skip = (params.page - 1) * params.pageSize;

  const where = buildContactFlowWhere({
    followUpId: params.followUpId,
    filter: params.filter,
  });

  const baseMetricsWhere = buildContactFlowWhere({
    followUpId: params.followUpId,
    filter: "all",
  });

  const [flows, totalItems, all, unread, waiting, confirmed, manual] =
    await Promise.all([
      prisma.maintenanceContactFlow.findMany({
        where,
        include: contactFlowInclude,
        orderBy: buildContactFlowOrderBy(params.sortKey, params.sortDirection),
        skip,
        take: params.pageSize,
      }),

      prisma.maintenanceContactFlow.count({ where }),

      prisma.maintenanceContactFlow.count({
        where: baseMetricsWhere,
      }),

      prisma.maintenanceContactFlow.count({
        where: buildContactFlowWhere({
          followUpId: params.followUpId,
          filter: "unread",
        }),
      }),

      prisma.maintenanceContactFlow.count({
        where: buildContactFlowWhere({
          followUpId: params.followUpId,
          filter: "waiting",
        }),
      }),

      prisma.maintenanceContactFlow.count({
        where: buildContactFlowWhere({
          followUpId: params.followUpId,
          filter: "confirmed",
        }),
      }),

      prisma.maintenanceContactFlow.count({
        where: buildContactFlowWhere({
          followUpId: params.followUpId,
          filter: "manual",
        }),
      }),
    ]);

  return {
    data: flows.map(mapContactFlow),
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / params.pageSize)),
    },
    metrics: {
      all,
      unread,
      waiting,
      confirmed,
      manual,
    },
  };
}

export async function createContactFlow(followUpId: string) {
  const existingFlow = await prisma.maintenanceContactFlow.findFirst({
    where: {
      follow_up_id: followUpId,
    },
    include: contactFlowInclude,
    orderBy: {
      created_at: "desc",
    },
  });

  if (existingFlow) {
    return {
      status: 200,
      data: mapContactFlow(existingFlow),
      message: "La gestión de contacto ya existe.",
    };
  }

  const followUp = await prisma.followUp.findUnique({
    where: {
      follow_up_id: followUpId,
    },
    include: {
      client: true,
      installation: true,
    },
  });

  if (!followUp) {
    return {
      status: 404,
      error: "Mantenimiento no encontrado.",
    };
  }

  const settings = await getOrCreateAppSettingsService();

  if (!settings.whatsapp_enabled) {
    return {
      status: 409,
      error:
        "No se puede iniciar la gestión porque WhatsApp está desactivado en la configuración general.",
    };
  }

  if (!followUp.client.whatsapp_opt_in) {
    return {
      status: 409,
      error:
        "No se puede iniciar la gestión porque el cliente no permite contacto por WhatsApp.",
    };
  }

  if (!followUp.client.phone_primary) {
    return {
      status: 409,
      error:
        "No se puede iniciar la gestión porque el cliente no tiene teléfono principal.",
    };
  }

  const createdFlow = await prisma.maintenanceContactFlow.create({
    data: {
      follow_up_id: followUp.follow_up_id,
      client_id: followUp.client_id,
      installation_id: followUp.installation_id,
      contact_phone: followUp.client.phone_primary,
      trigger_date: new Date(),
      status: "PENDING",
    },
    include: contactFlowInclude,
  });

  await recordContactFlowCreatedActivitySafely({
    clientId: createdFlow.client_id,
    contactFlowId: createdFlow.contact_flow_id,
    followUpId: createdFlow.follow_up_id,
    installationId: createdFlow.installation_id,
    phoneNumber: createdFlow.contact_phone,
  });

  return {
    status: 201,
    data: mapContactFlow(createdFlow),
    message: "Gestión de contacto iniciada correctamente.",
  };
}
