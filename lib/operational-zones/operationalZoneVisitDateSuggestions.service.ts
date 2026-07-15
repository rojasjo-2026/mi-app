import {
  evaluateAvailabilityForDate,
  type AvailabilityDateEvaluationResult,
} from "@/lib/availability/availability.service";
import { findOperationalZoneById } from "@/lib/operational-zones/operationalZones.repository";
import { findOperationalZoneVisitDates } from "@/lib/operational-zones/operationalZoneVisitDates.repository";
import {
  normalizeOperationalZoneVisitDateZoneId,
  OperationalZoneVisitDatesValidationError,
} from "@/lib/operational-zones/operationalZoneVisitDates.validators";

type OperationalZoneVisitDateSuggestionsServiceResult<T> = {
  status: number;
  body: {
    success: boolean;
    data?: T;
    message?: string;
  };
};

export type OperationalZoneVisitDateSuggestion = {
  operational_zone_visit_date_id: string;
  operational_zone_id: string;
  visit_date: string;
  can_offer_day: true;
  reason: string;
};

type EvaluatedVisitDate = {
  operational_zone_visit_date_id: string;
  operational_zone_id: string;
  visit_date: Date;
  availability: AvailabilityDateEvaluationResult;
};

function startOfCurrentUtcDay() {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildValidationErrorResponse<T>(
  error: OperationalZoneVisitDatesValidationError,
): OperationalZoneVisitDateSuggestionsServiceResult<T> {
  return {
    status: error.status,
    body: {
      success: false,
      message: error.message,
    },
  };
}

function buildUnexpectedErrorResponse<
  T,
>(): OperationalZoneVisitDateSuggestionsServiceResult<T> {
  return {
    status: 500,
    body: {
      success: false,
      message:
        "Ocurrió un error al consultar las fechas sugeridas para la zona.",
    },
  };
}

async function evaluateVisitDates(params: {
  countryCode: string;
  operationalZoneId: string;
  visitDates: Array<{
    operational_zone_visit_date_id: string;
    operational_zone_id: string;
    visit_date: Date;
  }>;
}) {
  const evaluatedVisitDates: EvaluatedVisitDate[] = [];

  /*
   * Se evalúan secuencialmente para no lanzar muchas consultas simultáneas
   * contra el motor de disponibilidad cuando una zona tenga numerosas fechas.
   */
  for (const visitDate of params.visitDates) {
    const availability = await evaluateAvailabilityForDate({
      country_code: params.countryCode,
      date: visitDate.visit_date,
      operational_zone_id: params.operationalZoneId,
    });

    evaluatedVisitDates.push({
      operational_zone_visit_date_id: visitDate.operational_zone_visit_date_id,
      operational_zone_id: visitDate.operational_zone_id,
      visit_date: visitDate.visit_date,
      availability,
    });
  }

  return evaluatedVisitDates;
}

function mapAvailableSuggestions(
  evaluatedVisitDates: EvaluatedVisitDate[],
): OperationalZoneVisitDateSuggestion[] {
  return evaluatedVisitDates
    .filter((item) => item.availability.can_offer_day)
    .map((item) => ({
      operational_zone_visit_date_id: item.operational_zone_visit_date_id,
      operational_zone_id: item.operational_zone_id,
      visit_date: formatDateOnly(item.visit_date),
      can_offer_day: true,
      reason:
        item.availability.reason ||
        "La fecha puede ofrecerse según las reglas actuales de agenda.",
    }));
}

export async function getOperationalZoneVisitDateSuggestions(
  operationalZoneId: unknown,
): Promise<
  OperationalZoneVisitDateSuggestionsServiceResult<
    OperationalZoneVisitDateSuggestion[]
  >
> {
  try {
    const normalizedOperationalZoneId =
      normalizeOperationalZoneVisitDateZoneId(operationalZoneId);

    const operationalZone = await findOperationalZoneById(
      normalizedOperationalZoneId,
    );

    if (!operationalZone) {
      return {
        status: 404,
        body: {
          success: false,
          message: "No se encontró la zona operativa.",
        },
      };
    }

    /*
     * Una zona inactiva conserva sus fechas históricas, pero no debe ofrecer
     * nuevas sugerencias mientras permanezca desactivada.
     */
    if (!operationalZone.is_active) {
      return {
        status: 200,
        body: {
          success: true,
          data: [],
          message:
            "La zona operativa está inactiva y no ofrece fechas sugeridas.",
        },
      };
    }

    const visitDates = await findOperationalZoneVisitDates({
      operational_zone_id: normalizedOperationalZoneId,
      active_only: true,
      from_date: startOfCurrentUtcDay(),
    });

    if (visitDates.length === 0) {
      return {
        status: 200,
        body: {
          success: true,
          data: [],
          message:
            "No hay fechas de visita activas y futuras configuradas para esta zona.",
        },
      };
    }

    const evaluatedVisitDates = await evaluateVisitDates({
      countryCode: operationalZone.country_code,
      operationalZoneId: normalizedOperationalZoneId,
      visitDates,
    });

    const suggestions = mapAvailableSuggestions(evaluatedVisitDates);

    return {
      status: 200,
      body: {
        success: true,
        data: suggestions,
        message:
          suggestions.length === 0
            ? "Las fechas programadas para esta zona no están disponibles actualmente."
            : undefined,
      },
    };
  } catch (error) {
    if (error instanceof OperationalZoneVisitDatesValidationError) {
      return buildValidationErrorResponse(error);
    }

    console.error("getOperationalZoneVisitDateSuggestions error:", error);

    return buildUnexpectedErrorResponse();
  }
}
