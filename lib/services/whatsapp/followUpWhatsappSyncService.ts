import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AutomationResult } from "@/lib/services/contactFlowAutomationService";

type FollowUpWhatsappSyncContactFlow = Prisma.MaintenanceContactFlowGetPayload<{
  include: {
    follow_up: {
      include: {
        follow_up_status: true;
      };
    };
  };
}>;

export async function syncFollowUpWithAutomation(params: {
  contactFlow: FollowUpWhatsappSyncContactFlow;
  automationResult: AutomationResult;
  receivedAt: Date;
  inboundText: string;
}) {
  const { contactFlow, automationResult, receivedAt, inboundText } = params;

  const existingNotes = contactFlow.follow_up.notes?.trim();
  const auditLine = buildFollowUpAuditLine({
    receivedAt,
    inboundText,
    automationResult,
  });

  let finalNotes = [existingNotes, auditLine].filter(Boolean).join("\n");

  const data: Prisma.FollowUpUncheckedUpdateInput = {
    notes: finalNotes,
  };

  if (automationResult.status === "CONFIRMED") {
    data.scheduled_date =
      contactFlow.follow_up.scheduled_date ?? contactFlow.follow_up.target_date;

    finalNotes = [
      finalNotes,
      `CONFIRMED FROM WHATSAPP ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join("\n");

    data.notes = finalNotes;

    const confirmedStatusId = await findFollowUpStatusId([
      "confirmed",
      "scheduled",
    ]);

    if (confirmedStatusId) {
      data.follow_up_status_id = confirmedStatusId;
    }
  }

  if (automationResult.status === "MANUAL_REQUIRED") {
    data.due_date = contactFlow.follow_up.due_date ?? receivedAt;

    finalNotes = [
      finalNotes,
      `MANUAL ACTION REQUIRED FROM WHATSAPP ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join("\n");

    data.notes = finalNotes;

    const manualStatusId = await findFollowUpStatusId([
      "manual_required",
      "manual",
      "pending",
    ]);

    if (manualStatusId) {
      data.follow_up_status_id = manualStatusId;
    }
  }

  if (automationResult.status === "REJECTED") {
    data.completed_at = receivedAt;

    finalNotes = [
      finalNotes,
      `REJECTED FROM WHATSAPP ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join("\n");

    data.notes = finalNotes;

    const rejectedStatusId = await findFollowUpStatusId([
      "rejected",
      "cancelled",
      "closed",
      "completed",
    ]);

    if (rejectedStatusId) {
      data.follow_up_status_id = rejectedStatusId;
    }
  }

  console.log("SYNC FOLLOW UP TRIGGERED", {
    followUpId: contactFlow.follow_up_id,
    automationStatus: automationResult.status,
    inboundText,
    data,
  });

  await prisma.followUp.update({
    where: {
      follow_up_id: contactFlow.follow_up_id,
    },
    data,
  });
}

async function findFollowUpStatusId(candidates: string[]) {
  const normalizedCandidates = candidates.map((value) => value.toLowerCase());

  const statuses = await prisma.followUpStatus.findMany({
    where: {
      is_active: true,
    },
    select: {
      follow_up_status_id: true,
      code: true,
    },
  });

  const match = statuses.find((status) =>
    normalizedCandidates.includes(status.code.toLowerCase()),
  );

  return match?.follow_up_status_id ?? null;
}

function buildFollowUpAuditLine(params: {
  receivedAt: Date;
  inboundText: string;
  automationResult: AutomationResult;
}) {
  const timestamp = new Intl.DateTimeFormat("es-CR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(params.receivedAt);

  return `[WhatsApp ${timestamp}] Cliente respondió "${params.inboundText}". Flujo actualizado a ${params.automationResult.status}.`;
}
