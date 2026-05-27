import type { Prisma } from "@prisma/client";

import { createActivityLog } from "@/lib/repositories/activityLogRepository";

type ContactFlowActivityInput = {
  clientId: string;
  contactFlowId: string;
  followUpId: string;
  installationId?: string | null;
  phoneNumber?: string | null;
  createdBy?: string | null;
};

export async function recordContactFlowCreatedActivitySafely(
  input: ContactFlowActivityInput,
) {
  try {
    return createActivityLog({
      client_id: input.clientId,
      entity_type: "CONTACT_FLOW",
      entity_id: input.contactFlowId,
      category: "CONTACT",
      action: "CONTACT_FLOW_CREATED",
      visibility: "PUBLIC_INTERNAL",
      title: "WhatsApp contact flow started",
      description: "A WhatsApp contact flow was started for this maintenance.",
      created_by: input.createdBy ?? null,
      metadata: {
        contact_flow_id: input.contactFlowId,
        follow_up_id: input.followUpId,
        installation_id: input.installationId ?? null,
        phone_number: input.phoneNumber ?? null,
        source: "whatsapp",
      } as Prisma.InputJsonValue,
    });
  } catch (error) {
    console.error("Error recording contact flow created activity:", error);
    return null;
  }
}
