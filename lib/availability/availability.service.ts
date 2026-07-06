import {
  buildAvailabilityRulesContext,
  evaluateDailyAvailabilityFromRules,
  type AvailabilityRulesContext,
  type DailyAvailabilityEvaluation,
} from "@/lib/availability/availabilityRules.service";

import {
  getDailyAvailabilityWorkload,
  type AvailabilityWorkloadQuery,
  type AvailabilityWorkloadResult,
} from "@/lib/availability/availabilityWorkload.repository";

import {
  DEFAULT_COUNTRY_CODE,
  normalizeCountryCode as normalizeConfiguredCountryCode,
} from "@/lib/config/app-settings";

export type AvailabilityDateEvaluationInput = {
  country_code: string;
  date: Date | string;
  operational_zone_id?: string | null;
};

export type AvailabilityDateEvaluationResult = {
  country_code: string;
  date: string;
  operational_zone_id: string | null;

  can_offer_day: boolean;
  reason: string | null;

  workload: {
    total_jobs: number;
    total_installations: number;
    total_maintenances: number;
    has_installation: boolean;
  };

  capacity: {
    max_jobs_per_day: number | null;
    max_installations_per_day: number | null;
    max_maintenances_per_day: number | null;
    remaining_jobs_capacity: number | null;
    remaining_installations_capacity: number | null;
    remaining_maintenances_capacity: number | null;
  };

  rules: {
    rules_loaded: number;
    min_time_between_jobs_minutes: number | null;
    block_day_if_installation_exists: boolean;
    allow_overbooking: boolean;
    group_by_zone: boolean;
    prioritize_overdue_maintenance: boolean;
  };
};

function normalizeAvailabilityCountryCode(value: string | null | undefined) {
  return normalizeConfiguredCountryCode(value, DEFAULT_COUNTRY_CODE);
}

function normalizeOptionalId(value: string | null | undefined) {
  const cleanValue = String(value || "").trim();

  return cleanValue || null;
}

function getDateOnlyParts(value: Date | string) {
  const rawValue =
    value instanceof Date
      ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
          2,
          "0",
        )}-${String(value.getDate()).padStart(2, "0")}`
      : String(value).trim().slice(0, 10);

  const match = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    throw new Error("La fecha no es válida.");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function createLocalDateOnly(value: Date | string) {
  const { year, month, day } = getDateOnlyParts(value);

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function normalizeDateOnly(value: Date | string) {
  const { year, month, day } = getDateOnlyParts(value);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

function mapAvailabilityResult(params: {
  rules: AvailabilityRulesContext;
  workload: AvailabilityWorkloadResult;
  evaluation: DailyAvailabilityEvaluation;
}): AvailabilityDateEvaluationResult {
  const { rules, workload, evaluation } = params;

  return {
    country_code: workload.country_code,
    date: evaluation.date,
    operational_zone_id: workload.operational_zone_id,

    can_offer_day: evaluation.can_offer_day,
    reason: evaluation.reason,

    workload: {
      total_jobs: workload.total_jobs,
      total_installations: workload.total_installations,
      total_maintenances: workload.total_maintenances,
      has_installation: workload.has_installation,
    },

    capacity: {
      max_jobs_per_day: evaluation.max_jobs_per_day,
      max_installations_per_day: evaluation.max_installations_per_day,
      max_maintenances_per_day: evaluation.max_maintenances_per_day,
      remaining_jobs_capacity: evaluation.remaining_jobs_capacity,
      remaining_installations_capacity:
        evaluation.remaining_installations_capacity,
      remaining_maintenances_capacity:
        evaluation.remaining_maintenances_capacity,
    },

    rules: {
      rules_loaded: rules.rules_loaded,
      min_time_between_jobs_minutes: rules.min_time_between_jobs_minutes,
      block_day_if_installation_exists: rules.block_day_if_installation_exists,
      allow_overbooking: rules.allow_overbooking,
      group_by_zone: rules.group_by_zone,
      prioritize_overdue_maintenance: rules.prioritize_overdue_maintenance,
    },
  };
}

export async function evaluateAvailabilityForDate(
  input: AvailabilityDateEvaluationInput,
): Promise<AvailabilityDateEvaluationResult> {
  const countryCode = normalizeAvailabilityCountryCode(input.country_code);
  const operationalZoneId = normalizeOptionalId(input.operational_zone_id);

  const [rules, workload] = await Promise.all([
    buildAvailabilityRulesContext(countryCode),
    getDailyAvailabilityWorkload({
      country_code: countryCode,
      date: input.date,
      operational_zone_id: operationalZoneId,
    }),
  ]);

  const evaluation = evaluateDailyAvailabilityFromRules({
    rules,
    workload: {
      country_code: workload.country_code,
      date: workload.date,
      total_jobs: workload.total_jobs,
      total_installations: workload.total_installations,
      total_maintenances: workload.total_maintenances,
      has_installation: workload.has_installation,
    },
  });

  return mapAvailabilityResult({
    rules,
    workload,
    evaluation,
  });
}

export async function evaluateAvailabilityForDateRange(params: {
  country_code: string;
  start_date: Date | string;
  days: number;
  operational_zone_id?: string | null;
}) {
  const countryCode = normalizeAvailabilityCountryCode(params.country_code);
  const operationalZoneId = normalizeOptionalId(params.operational_zone_id);
  const startDate = createLocalDateOnly(params.start_date);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("La fecha inicial no es válida.");
  }

  const safeDays =
    Number.isFinite(params.days) && params.days > 0
      ? Math.min(Math.floor(params.days), 31)
      : 7;

  const dates = Array.from({ length: safeDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });

  const results = await Promise.all(
    dates.map((date) =>
      evaluateAvailabilityForDate({
        country_code: countryCode,
        date,
        operational_zone_id: operationalZoneId,
      }),
    ),
  );

  return {
    country_code: countryCode,
    start_date: normalizeDateOnly(startDate),
    days: safeDays,
    operational_zone_id: operationalZoneId,
    results,
  };
}

export function buildAvailabilityWorkloadQuery(
  input: AvailabilityDateEvaluationInput,
): AvailabilityWorkloadQuery {
  return {
    country_code: normalizeAvailabilityCountryCode(input.country_code),
    date: input.date,
    operational_zone_id: normalizeOptionalId(input.operational_zone_id),
  };
}
