import { prisma } from "@/lib/prisma";

export async function findPendingFollowUpsForAutoContact() {
  return prisma.followUp.findMany({
    where: {
      follow_up_status: {
        code: "pending",
      },
      client: {
        whatsapp_opt_in: true,
        auto_contact_enabled: true,
      },
    },
    include: {
      client: true,
      installation: true,
      follow_up_status: true,
    },
    orderBy: [{ target_date: "asc" }, { created_at: "desc" }],
  });
}

export async function findOpenContactFlowByFollowUpId(followUpId: string) {
  return prisma.maintenanceContactFlow.findFirst({
    where: {
      follow_up_id: followUpId,
      status: {
        not: "CLOSED",
      },
    },
  });
}

export async function createMaintenanceContactFlow(data: {
  follow_up_id: string;
  client_id: string;
  installation_id: string | null;
  trigger_date: Date;
  status?: "PENDING" | "MESSAGE_SENT";
  first_message_sent_at?: Date | null;
  last_message_at?: Date | null;
}) {
  return prisma.maintenanceContactFlow.create({
    data: {
      follow_up_id: data.follow_up_id,
      client_id: data.client_id,
      installation_id: data.installation_id,
      trigger_date: data.trigger_date,
      status: data.status ?? "PENDING",
      first_message_sent_at: data.first_message_sent_at ?? null,
      last_message_at: data.last_message_at ?? null,
    },
  });
}

export async function createMaintenanceContactMessage(data: {
  contact_flow_id: string;
  direction: "OUTBOUND" | "INBOUND";
  message_text: string;
  sent_at?: Date | null;
  received_at?: Date | null;
}) {
  return prisma.maintenanceContactMessage.create({
    data: {
      contact_flow_id: data.contact_flow_id,
      direction: data.direction,
      message_text: data.message_text,
      sent_at: data.sent_at ?? null,
      received_at: data.received_at ?? null,
    },
  });
}

export async function updateMaintenanceContactFlow(
  contactFlowId: string,
  data: {
    status?:
      | "PENDING"
      | "MESSAGE_SENT"
      | "WAITING_RESPONSE"
      | "OPTIONS_SENT"
      | "DATE_SELECTED"
      | "CONFIRMED"
      | "MANUAL_REQUIRED"
      | "NO_RESPONSE"
      | "REJECTED"
      | "CLOSED";
    first_message_sent_at?: Date | null;
    last_message_at?: Date | null;
    requires_manual_action?: boolean;
    manual_reason?: string | null;
    closed_at?: Date | null;
    reminder_count?: number;
    selected_date?: Date | null;
  },
) {
  return prisma.maintenanceContactFlow.update({
    where: {
      contact_flow_id: contactFlowId,
    },
    data,
  });
}
