import {
  createMaintenanceContactFlow,
  createMaintenanceContactMessage,
  findOpenContactFlowByFollowUpId,
  findPendingFollowUpsForAutoContact,
  updateMaintenanceContactFlow,
} from "@/lib/repositories/maintenanceContactRepository";

function buildInitialMaintenanceMessage(params: {
  clientFirstName: string;
  installationDescription?: string | null;
}) {
  const installationLabel =
    params.installationDescription?.trim() || "su equipo";

  return `Hola ${params.clientFirstName}, le contactamos porque el mantenimiento de ${installationLabel} se aproxima. Responda con una opción: 1. Ver fechas disponibles 2. Solicitar otra fecha 3. Ya no deseo programarlo 4. Hablar con un asesor`;
}

export async function runMaintenanceContactFlowsService() {
  const today = new Date();
  const followUps = await findPendingFollowUpsForAutoContact();

  let createdCount = 0;

  for (const followUp of followUps) {
    const daysBefore = followUp.client.maintenance_contact_days_before ?? 22;

    const limitDate = new Date(today);
    limitDate.setDate(today.getDate() + daysBefore);

    if (followUp.target_date > limitDate) {
      continue;
    }

    const existingFlow = await findOpenContactFlowByFollowUpId(
      followUp.follow_up_id,
    );

    if (existingFlow) {
      continue;
    }

    const now = new Date();

    const flow = await createMaintenanceContactFlow({
      follow_up_id: followUp.follow_up_id,
      client_id: followUp.client_id,
      installation_id: followUp.installation_id ?? null,
      trigger_date: now,
      status: "MESSAGE_SENT",
      first_message_sent_at: now,
      last_message_at: now,
    });

    const messageText = buildInitialMaintenanceMessage({
      clientFirstName: followUp.client.first_name,
      installationDescription: followUp.installation?.description,
    });

    await createMaintenanceContactMessage({
      contact_flow_id: flow.contact_flow_id,
      direction: "OUTBOUND",
      message_text: messageText,
      sent_at: now,
    });

    await updateMaintenanceContactFlow(flow.contact_flow_id, {
      status: "WAITING_RESPONSE",
      last_message_at: now,
    });

    createdCount++;
  }

  return {
    totalCandidates: followUps.length,
    createdFlows: createdCount,
  };
}
