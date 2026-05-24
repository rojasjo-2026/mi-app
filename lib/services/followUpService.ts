import type { WorkBillingStatus } from "@prisma/client";
import {
  findClientById,
  findInstallationById,
  findInstallationWithClientById,
  findPendingFollowUpStatus,
  findCompletedFollowUpStatus,
  findActiveCompletedFollowUpStatus,
  findPostponedFollowUpStatus,
  findFollowUpById,
  createFollowUp,
  completeFollowUp,
  postponeFollowUp,
  updateFollowUp,
  findFollowUps,
  createMaintenanceContactFlowForFollowUp,
  type FindFollowUpsParams,
  type UpdateFollowUpData,
} from "@/lib/repositories/followUpRepository";

import {
  recordFollowUpActivityChangesSafely,
  recordFollowUpCreatedActivitySafely,
} from "@/lib/services/activityLogService";
import { getOrCreateAppSettingsService } from "@/lib/services/settingsService";
import { validateCreateFollowUp } from "@/lib/validators/followUpValidator";
import { toDateOrFallback } from "@/lib/utils/date.utils";
import { toTrimmedStringOrFallback } from "@/lib/utils/string.utils";
import { toNumberOrFallback } from "@/lib/utils/number.utils";

type CreateFollowUpInput = {
  client_id?: string;
  installation_id?: string | null;
  target_date?: string;
  due_date?: string | null;
  reason?: string | null;
  priority?: number | string | null;
  notes?: string | null;
  created_from?: string | null;

  estimated_amount?: number | string | null;
  final_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  maintenance_type?: string | null;
  technician_id?: string | null;
  operational_zone_id?: string | null;
};

type UpdateFollowUpInput = {
  target_date?: string;
  due_date?: string | null;
  reason?: string | null;
  priority?: number | string | null;
  notes?: string | null;

  estimated_amount?: number | string | null;
  final_amount?: number | string | null;
  cost_amount?: number | string | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  maintenance_type?: string | null;
  technician_id?: string | null;
  operational_zone_id?: string | null;
};

type ExistingFollowUp = NonNullable<
  Awaited<ReturnType<typeof findFollowUpById>>
>;

type FollowUpValidationInput = Parameters<typeof validateCreateFollowUp>[0];

const WORK_BILLING_STATUSES: readonly WorkBillingStatus[] = [
  "PENDING",
  "INVOICED",
  "PARTIALLY_PAID",
  "PAID",
  "NOT_BILLABLE",
  "BILLING_ERROR",
  "CANCELLED",
];

function calculateContactTriggerDate(targetDate: Date, daysBefore: number) {
  const triggerDate = new Date(targetDate);

  triggerDate.setDate(triggerDate.getDate() - daysBefore);
  triggerDate.setHours(0, 0, 0, 0);

  return triggerDate;
}

function normalizeDaysBefore(value: number | null | undefined, fallback = 22) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(parsedValue), 1), 365);
}

function toWorkBillingStatusOrFallback(
  value: unknown,
  fallback: WorkBillingStatus = "PENDING",
): WorkBillingStatus {
  if (value === null || value === undefined) {
    return fallback;
  }

  const normalizedValue = String(value).trim().toUpperCase();

  if (!normalizedValue) {
    return fallback;
  }

  return WORK_BILLING_STATUSES.includes(normalizedValue as WorkBillingStatus)
    ? (normalizedValue as WorkBillingStatus)
    : fallback;
}

function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    const parsedValue = Number(trimmedValue);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber?: () => number }).toNumber === "function"
  ) {
    const parsedValue = (value as { toNumber: () => number }).toNumber();

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function buildFollowUpUpdateValidationInput(
  existing: ExistingFollowUp,
  body: UpdateFollowUpInput,
): FollowUpValidationInput {
  return {
    client_id: existing.client_id,
    target_date:
      body.target_date !== undefined ? body.target_date : existing.target_date,
    due_date: body.due_date !== undefined ? body.due_date : existing.due_date,
    priority: body.priority !== undefined ? body.priority : existing.priority,
    estimated_amount:
      body.estimated_amount !== undefined
        ? body.estimated_amount
        : decimalToNumber(existing.estimated_amount),
    final_amount:
      body.final_amount !== undefined
        ? body.final_amount
        : decimalToNumber(existing.final_amount),
    cost_amount:
      body.cost_amount !== undefined
        ? body.cost_amount
        : decimalToNumber(existing.cost_amount),
    billing_status:
      body.billing_status !== undefined
        ? body.billing_status
        : existing.billing_status,
    maintenance_type:
      body.maintenance_type !== undefined
        ? body.maintenance_type
        : existing.maintenance_type,
    technician_id:
      body.technician_id !== undefined
        ? body.technician_id
        : existing.technician_id,
  };
}

async function createContactFlowSafelyFromFollowUp(
  followUp: Awaited<ReturnType<typeof createFollowUp>>,
) {
  try {
    const settings = await getOrCreateAppSettingsService();

    if (!settings.whatsapp_enabled || !settings.auto_contact_enabled) {
      console.log(
        "Contact flow not created because system automation is disabled.",
        {
          followUpId: followUp.follow_up_id,
          whatsappEnabled: settings.whatsapp_enabled,
          autoContactEnabled: settings.auto_contact_enabled,
        },
      );

      return null;
    }

    if (!followUp.client.whatsapp_opt_in) {
      console.log("Contact flow not created because client has not opted in.", {
        followUpId: followUp.follow_up_id,
        clientId: followUp.client_id,
      });

      return null;
    }

    const daysBefore = normalizeDaysBefore(
      settings.maintenance_contact_days_before,
      22,
    );

    const triggerDate = calculateContactTriggerDate(
      followUp.target_date,
      daysBefore,
    );

    const contactFlow = await createMaintenanceContactFlowForFollowUp({
      follow_up_id: followUp.follow_up_id,
      client_id: followUp.client_id,
      installation_id: followUp.installation_id,
      trigger_date: triggerDate,
      contact_phone: followUp.client.phone_primary,
    });

    console.log("Contact flow created for follow-up:", {
      followUpId: followUp.follow_up_id,
      contactFlowId: contactFlow.contact_flow_id,
      triggerDate,
      daysBefore,
    });

    return contactFlow;
  } catch (error) {
    console.error("Error creating contact flow from follow-up:", {
      followUpId: followUp.follow_up_id,
      error,
    });

    return null;
  }
}

async function createInvoiceSafelyFromFollowUp(followUpId: string) {
  console.log(
    "Automatic invoice creation from follow-up is disabled. Use Finance > Pending Billables to generate the invoice.",
    {
      followUpId,
    },
  );

  return null;
}

export async function getFollowUpsService(params: {
  client_id?: string;
  installation_id?: string;
  operational_zone_id?: string;
  status?: string;
  priority?: string | number | null;
}) {
  const parsedPriority =
    params.priority !== undefined &&
    params.priority !== null &&
    params.priority !== ""
      ? toNumberOrFallback(params.priority, null)
      : undefined;

  const filters: FindFollowUpsParams = {
    client_id: params.client_id,
    installation_id: params.installation_id,
    operational_zone_id: params.operational_zone_id,
    status: params.status,
    ...(parsedPriority !== undefined && parsedPriority !== null
      ? { priority: parsedPriority }
      : {}),
  };

  return findFollowUps(filters);
}

export async function getFollowUpByIdService(id: string) {
  return findFollowUpById(id);
}

export async function createFollowUpService(body: CreateFollowUpInput) {
  const errors = validateCreateFollowUp(body);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const clientId = String(body.client_id).trim();

  const client = await findClientById(clientId);
  if (!client) {
    return { success: false, code: "client_not_found" };
  }

  const installation = body.installation_id
    ? await findInstallationById(body.installation_id)
    : null;

  if (body.installation_id && !installation) {
    return { success: false, code: "installation_not_found" };
  }

  if (installation && installation.client_id !== clientId) {
    return { success: false, code: "installation_client_mismatch" };
  }

  const operationalZoneId =
    toTrimmedStringOrFallback(body.operational_zone_id, null) ??
    installation?.operational_zone_id ??
    null;

  const pendingStatus = await findPendingFollowUpStatus();

  if (!pendingStatus) {
    return {
      success: false,
      code: "pending_status_not_found",
    };
  }

  const targetDate = toDateOrFallback(body.target_date, null);
  const dueDate = toDateOrFallback(body.due_date, null);
  const priority = toNumberOrFallback(body.priority, 3) ?? 3;

  if (!targetDate) {
    return {
      success: false,
      errors: [{ field: "target_date", error: "invalid" }],
    };
  }

  const followUp = await createFollowUp({
    client_id: clientId,
    installation_id: body.installation_id?.trim() || null,
    operational_zone_id: operationalZoneId,
    follow_up_status_id: pendingStatus.follow_up_status_id,
    target_date: targetDate,
    due_date: dueDate,
    reason: toTrimmedStringOrFallback(body.reason, null),
    priority,
    notes: toTrimmedStringOrFallback(body.notes, null),
    created_from:
      toTrimmedStringOrFallback(body.created_from, "manual") ?? "manual",

    estimated_amount: toNumberOrFallback(body.estimated_amount, null),
    final_amount: toNumberOrFallback(body.final_amount, null),
    cost_amount: toNumberOrFallback(body.cost_amount, null),
    billing_status: toWorkBillingStatusOrFallback(body.billing_status),
    billing_notes: toTrimmedStringOrFallback(body.billing_notes, null),
    maintenance_type: toTrimmedStringOrFallback(body.maintenance_type, null),
    technician_id: toTrimmedStringOrFallback(body.technician_id, null),
  });

  await recordFollowUpCreatedActivitySafely(followUp);
  await createContactFlowSafelyFromFollowUp(followUp);

  return {
    success: true,
    followUp,
  };
}

export async function createFollowUpFromInstallationService(
  installationId: string,
  body: CreateFollowUpInput,
) {
  const mergedBody = {
    ...body,
    client_id: "installation-context",
  };

  const errors = validateCreateFollowUp(mergedBody);

  if (errors.length > 0) {
    return {
      success: false,
      errors: errors.filter((e) => e.field !== "client_id"),
    };
  }

  const installation = await findInstallationWithClientById(installationId);

  if (!installation) {
    return null;
  }

  const pendingStatus = await findPendingFollowUpStatus();

  if (!pendingStatus) {
    return {
      success: false,
      code: "pending_status_not_found",
    };
  }

  const targetDate = toDateOrFallback(body.target_date, null);
  const dueDate = toDateOrFallback(body.due_date, null);
  const priority = toNumberOrFallback(body.priority, 3) ?? 3;

  if (!targetDate) {
    return {
      success: false,
      errors: [{ field: "target_date", error: "invalid" }],
    };
  }

  const operationalZoneId =
    toTrimmedStringOrFallback(body.operational_zone_id, null) ??
    installation.operational_zone_id ??
    null;

  const followUp = await createFollowUp({
    client_id: installation.client_id,
    installation_id: installation.installation_id,
    operational_zone_id: operationalZoneId,
    follow_up_status_id: pendingStatus.follow_up_status_id,
    target_date: targetDate,
    due_date: dueDate,
    reason:
      toTrimmedStringOrFallback(body.reason, "Seguimiento desde instalación") ??
      "Seguimiento desde instalación",
    priority,
    notes: toTrimmedStringOrFallback(body.notes, null),
    created_from: "installation",

    estimated_amount: toNumberOrFallback(body.estimated_amount, null),
    final_amount: toNumberOrFallback(body.final_amount, null),
    cost_amount: toNumberOrFallback(body.cost_amount, null),
    billing_status: toWorkBillingStatusOrFallback(body.billing_status),
    billing_notes: toTrimmedStringOrFallback(body.billing_notes, null),
    maintenance_type: toTrimmedStringOrFallback(body.maintenance_type, null),
    technician_id: toTrimmedStringOrFallback(body.technician_id, null),
  });

  await recordFollowUpCreatedActivitySafely(followUp);
  await createContactFlowSafelyFromFollowUp(followUp);

  return {
    success: true,
    followUp,
  };
}

export async function completeFollowUpByIdService(id: string) {
  const existing = await findFollowUpById(id);

  if (!existing) {
    return null;
  }

  const completedStatus = await findCompletedFollowUpStatus();

  if (!completedStatus) {
    return {
      success: false,
      code: "completed_status_not_found",
    };
  }

  if (existing.follow_up_status?.code === "completed") {
    await createInvoiceSafelyFromFollowUp(id);

    return {
      success: true,
      followUp: existing,
    };
  }

  const followUp = await completeFollowUp(
    id,
    completedStatus.follow_up_status_id,
  );

  await recordFollowUpActivityChangesSafely({
    before: existing,
    after: followUp,
  });

  await createInvoiceSafelyFromFollowUp(id);

  return {
    success: true,
    followUp,
  };
}

export async function completeFollowUpStrictService(id: string) {
  const existing = await findFollowUpById(id);

  if (!existing) {
    return null;
  }

  const completedStatus = await findActiveCompletedFollowUpStatus();

  if (!completedStatus) {
    return {
      success: false,
      code: "completed_status_not_found",
    };
  }

  if (existing.follow_up_status_id === completedStatus.follow_up_status_id) {
    return {
      success: false,
      code: "already_completed",
    };
  }

  const followUp = await completeFollowUp(
    id,
    completedStatus.follow_up_status_id,
  );

  await recordFollowUpActivityChangesSafely({
    before: existing,
    after: followUp,
  });

  await createInvoiceSafelyFromFollowUp(id);

  return {
    success: true,
    followUp,
  };
}

export async function postponeFollowUpByIdService(
  id: string,
  body: {
    target_date?: string;
    due_date?: string | null;
  },
) {
  const existing = await findFollowUpById(id);

  if (!existing) {
    return null;
  }

  if (!body.target_date || !String(body.target_date).trim()) {
    return {
      success: false,
      errors: [{ field: "target_date", error: "required" }],
    };
  }

  const postponedStatus = await findPostponedFollowUpStatus();

  if (!postponedStatus) {
    return {
      success: false,
      code: "postponed_status_not_found",
    };
  }

  const targetDate = toDateOrFallback(body.target_date, null);
  const dueDate = toDateOrFallback(body.due_date, null);

  if (!targetDate) {
    return {
      success: false,
      errors: [{ field: "target_date", error: "invalid" }],
    };
  }

  const followUp = await postponeFollowUp(id, {
    target_date: targetDate,
    due_date: dueDate,
    follow_up_status_id: postponedStatus.follow_up_status_id,
  });

  await recordFollowUpActivityChangesSafely({
    before: existing,
    after: followUp,
  });

  return {
    success: true,
    followUp,
  };
}

export async function updateFollowUpByIdService(
  id: string,
  body: UpdateFollowUpInput,
) {
  const existing = await findFollowUpById(id);

  if (!existing) {
    return null;
  }

  const validationErrors = validateCreateFollowUp(
    buildFollowUpUpdateValidationInput(existing, body),
  ).filter((error) => error.field !== "client_id");

  if (validationErrors.length > 0) {
    return { success: false, errors: validationErrors };
  }

  const nextTargetDate =
    body.target_date !== undefined
      ? toDateOrFallback(body.target_date, null)
      : undefined;

  const nextDueDate =
    body.due_date !== undefined
      ? toDateOrFallback(body.due_date, null)
      : undefined;

  const nextPriority =
    body.priority !== undefined
      ? toNumberOrFallback(body.priority, null)
      : undefined;

  const updateData: UpdateFollowUpData = {};

  if (nextTargetDate !== undefined && nextTargetDate !== null) {
    updateData.target_date = nextTargetDate;
  }

  if (nextDueDate !== undefined) {
    updateData.due_date = nextDueDate;
  }

  if (nextPriority !== undefined && nextPriority !== null) {
    updateData.priority = nextPriority;
  }

  if (body.reason !== undefined) {
    updateData.reason = toTrimmedStringOrFallback(body.reason, null);
  }

  if (body.notes !== undefined) {
    updateData.notes = toTrimmedStringOrFallback(body.notes, null);
  }

  if (body.operational_zone_id !== undefined) {
    updateData.operational_zone_id = toTrimmedStringOrFallback(
      body.operational_zone_id,
      null,
    );
  }

  if (body.estimated_amount !== undefined) {
    updateData.estimated_amount = toNumberOrFallback(
      body.estimated_amount,
      null,
    );
  }

  if (body.final_amount !== undefined) {
    updateData.final_amount = toNumberOrFallback(body.final_amount, null);
  }

  if (body.cost_amount !== undefined) {
    updateData.cost_amount = toNumberOrFallback(body.cost_amount, null);
  }

  if (body.billing_status !== undefined) {
    updateData.billing_status = toWorkBillingStatusOrFallback(
      body.billing_status,
    );
  }

  if (body.billing_notes !== undefined) {
    updateData.billing_notes = toTrimmedStringOrFallback(
      body.billing_notes,
      null,
    );
  }

  if (body.maintenance_type !== undefined) {
    updateData.maintenance_type = toTrimmedStringOrFallback(
      body.maintenance_type,
      null,
    );
  }

  if (body.technician_id !== undefined) {
    updateData.technician_id = toTrimmedStringOrFallback(
      body.technician_id,
      null,
    );
  }

  const followUp = await updateFollowUp(id, updateData);

  await recordFollowUpActivityChangesSafely({
    before: existing,
    after: followUp,
  });

  return {
    success: true,
    followUp,
  };
}
