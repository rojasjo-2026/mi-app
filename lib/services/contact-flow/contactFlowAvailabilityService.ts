import type { AutomationResult } from "@/lib/services/contactFlowAutomationService";
import {
  evaluateAvailabilityForDate,
  type AvailabilityDateEvaluationResult,
} from "@/lib/availability/availability.service";
import { prisma } from "@/lib/prisma";

type ContactFlowAvailabilityCheckResult = {
  checked: boolean;
  canOfferDay: boolean;
  requiresManualValidation: boolean;
  countryCode: string;
  date: Date | null;
  operationalZoneId: string | null;
  reason: string;
  availability: AvailabilityDateEvaluationResult | null;
};

function isConfirmationPendingOperationalValidation(
  automationResult: AutomationResult,
) {
  return (
    automationResult.status === "MANUAL_REQUIRED" &&
    automationResult.requiresManualAction &&
    Boolean(
      automationResult.manualReason?.includes("validar agenda") ||
      automationResult.manualReason?.includes("confirmó disponibilidad"),
    )
  );
}

function formatAvailabilityDate(value: Date | null) {
  if (!value) return "fecha no disponible";

  return new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export async function evaluateContactFlowAvailability(
  contactFlowId: string,
): Promise<ContactFlowAvailabilityCheckResult> {
  const contactFlow = await prisma.maintenanceContactFlow.findUnique({
    where: {
      contact_flow_id: contactFlowId,
    },
    select: {
      contact_flow_id: true,
      follow_up: {
        select: {
          target_date: true,
          scheduled_date: true,
          operational_zone_id: true,
        },
      },
      installation: {
        select: {
          operational_zone_id: true,
        },
      },
      client: {
        select: {
          country_code: true,
          operational_zone_id: true,
        },
      },
    },
  });

  if (!contactFlow?.follow_up) {
    return {
      checked: false,
      canOfferDay: false,
      requiresManualValidation: true,
      countryCode: "CR",
      date: null,
      operationalZoneId: null,
      reason:
        "No se pudo validar disponibilidad porque no se encontró el mantenimiento relacionado.",
      availability: null,
    };
  }

  const countryCode = contactFlow.client?.country_code || "CR";
  const date =
    contactFlow.follow_up.scheduled_date ?? contactFlow.follow_up.target_date;

  const operationalZoneId =
    contactFlow.follow_up.operational_zone_id ??
    contactFlow.installation?.operational_zone_id ??
    contactFlow.client?.operational_zone_id ??
    null;

  if (!date) {
    return {
      checked: false,
      canOfferDay: false,
      requiresManualValidation: true,
      countryCode,
      date: null,
      operationalZoneId,
      reason:
        "No se pudo validar disponibilidad porque el mantenimiento no tiene fecha objetivo ni fecha programada.",
      availability: null,
    };
  }

  const availability = await evaluateAvailabilityForDate({
    country_code: countryCode,
    date,
    operational_zone_id: operationalZoneId,
  });

  return {
    checked: true,
    canOfferDay: availability.can_offer_day,
    requiresManualValidation: true,
    countryCode,
    date,
    operationalZoneId,
    reason:
      availability.reason ||
      "La disponibilidad fue evaluada con las reglas actuales de agenda.",
    availability,
  };
}

export function mergeAutomationWithAvailability(params: {
  automationResult: AutomationResult;
  availabilityResult: ContactFlowAvailabilityCheckResult;
}): AutomationResult {
  const { automationResult, availabilityResult } = params;

  if (!isConfirmationPendingOperationalValidation(automationResult)) {
    return automationResult;
  }

  const dateLabel = formatAvailabilityDate(availabilityResult.date);

  if (!availabilityResult.checked) {
    return {
      ...automationResult,
      status: "MANUAL_REQUIRED",
      requiresManualAction: true,
      manualReason: `${automationResult.manualReason} ${availabilityResult.reason}`,
      selectedDate: null,
      shouldClose: false,
    };
  }

  if (availabilityResult.canOfferDay) {
    return {
      ...automationResult,
      status: "MANUAL_REQUIRED",
      requiresManualAction: true,
      manualReason: `${automationResult.manualReason} La fecha ${dateLabel} fue evaluada y actualmente puede ofrecerse según las reglas de agenda, pero todavía requiere validación operativa manual antes de confirmar automáticamente.`,
      selectedDate: null,
      shouldClose: false,
    };
  }

  return {
    ...automationResult,
    status: "MANUAL_REQUIRED",
    requiresManualAction: true,
    manualReason: `${automationResult.manualReason} La fecha ${dateLabel} no debe confirmarse automáticamente. Motivo: ${availabilityResult.reason}`,
    selectedDate: null,
    shouldClose: false,
  };
}
