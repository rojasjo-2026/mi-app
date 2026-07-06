import type { AgendaRule } from "@prisma/client";

import {
  DEFAULT_COUNTRY_CODE,
  normalizeCountryCode as normalizeConfiguredCountryCode,
} from "@/lib/config/app-settings";
import { prisma } from "@/lib/prisma";

export type AvailabilityRuleKey =
  | "MAX_JOBS_PER_DAY"
  | "MIN_TIME_BETWEEN_JOBS"
  | "BLOCK_DAY_IF_INSTALLATION_EXISTS"
  | "MAX_INSTALLATIONS_PER_DAY"
  | "MAX_MAINTENANCES_PER_DAY"
  | "ALLOW_OVERBOOKING"
  | "GROUP_BY_ZONE"
  | "PRIORITIZE_OVERDUE_MAINTENANCE";

export type AvailabilityRulesContext = {
  country_code: string;
  rules_loaded: number;

  max_jobs_per_day: number | null;
  min_time_between_jobs_minutes: number | null;
  block_day_if_installation_exists: boolean;
  max_installations_per_day: number | null;
  max_maintenances_per_day: number | null;
  allow_overbooking: boolean;
  group_by_zone: boolean;
  prioritize_overdue_maintenance: boolean;

  raw_rules: AgendaRule[];
};

export type DailyWorkloadInput = {
  country_code: string;
  date: Date | string;

  total_jobs: number;
  total_installations: number;
  total_maintenances: number;
  has_installation: boolean;
};

export type DailyAvailabilityEvaluation = {
  date: string;
  can_offer_day: boolean;
  reason: string | null;

  total_jobs: number;
  total_installations: number;
  total_maintenances: number;

  max_jobs_per_day: number | null;
  max_installations_per_day: number | null;
  max_maintenances_per_day: number | null;

  remaining_jobs_capacity: number | null;
  remaining_installations_capacity: number | null;
  remaining_maintenances_capacity: number | null;

  block_day_if_installation_exists: boolean;
  allow_overbooking: boolean;
};

function normalizeAvailabilityCountryCode(value: string | null | undefined) {
  return normalizeConfiguredCountryCode(value, DEFAULT_COUNTRY_CODE);
}

function normalizeDateOnly(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function getRuleByKey(rules: AgendaRule[], ruleKey: AvailabilityRuleKey) {
  return rules.find((rule) => rule.rule_key === ruleKey) || null;
}

function getNumberRuleValue(rules: AgendaRule[], ruleKey: AvailabilityRuleKey) {
  const rule = getRuleByKey(rules, ruleKey);

  if (!rule || !rule.is_active) {
    return null;
  }

  if (rule.value_number !== null && rule.value_number !== undefined) {
    return rule.value_number;
  }

  if (rule.value_decimal !== null && rule.value_decimal !== undefined) {
    const parsedValue = Number(rule.value_decimal.toString());

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  if (rule.value_text) {
    const parsedValue = Number(rule.value_text);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

function getBooleanRuleValue(
  rules: AgendaRule[],
  ruleKey: AvailabilityRuleKey,
) {
  const rule = getRuleByKey(rules, ruleKey);

  if (!rule || !rule.is_active) {
    return false;
  }

  if (rule.value_boolean !== null && rule.value_boolean !== undefined) {
    return rule.value_boolean;
  }

  if (rule.value_text) {
    const normalizedValue = rule.value_text.trim().toLowerCase();

    if (normalizedValue === "true" || normalizedValue === "yes") {
      return true;
    }

    if (normalizedValue === "false" || normalizedValue === "no") {
      return false;
    }
  }

  return false;
}

export async function getActiveAgendaRulesForAvailability(countryCode: string) {
  const normalizedCountryCode = normalizeAvailabilityCountryCode(countryCode);

  return prisma.agendaRule.findMany({
    where: {
      country_code: normalizedCountryCode,
      is_active: true,
    },
    orderBy: [
      {
        sort_order: "asc",
      },
      {
        rule_name: "asc",
      },
    ],
  });
}

export async function buildAvailabilityRulesContext(
  countryCode: string,
): Promise<AvailabilityRulesContext> {
  const normalizedCountryCode = normalizeAvailabilityCountryCode(countryCode);
  const rules = await getActiveAgendaRulesForAvailability(
    normalizedCountryCode,
  );

  return {
    country_code: normalizedCountryCode,
    rules_loaded: rules.length,

    max_jobs_per_day: getNumberRuleValue(rules, "MAX_JOBS_PER_DAY"),
    min_time_between_jobs_minutes: getNumberRuleValue(
      rules,
      "MIN_TIME_BETWEEN_JOBS",
    ),
    block_day_if_installation_exists: getBooleanRuleValue(
      rules,
      "BLOCK_DAY_IF_INSTALLATION_EXISTS",
    ),
    max_installations_per_day: getNumberRuleValue(
      rules,
      "MAX_INSTALLATIONS_PER_DAY",
    ),
    max_maintenances_per_day: getNumberRuleValue(
      rules,
      "MAX_MAINTENANCES_PER_DAY",
    ),
    allow_overbooking: getBooleanRuleValue(rules, "ALLOW_OVERBOOKING"),
    group_by_zone: getBooleanRuleValue(rules, "GROUP_BY_ZONE"),
    prioritize_overdue_maintenance: getBooleanRuleValue(
      rules,
      "PRIORITIZE_OVERDUE_MAINTENANCE",
    ),

    raw_rules: rules,
  };
}

function calculateRemainingCapacity(
  limit: number | null,
  currentValue: number,
) {
  if (limit === null) {
    return null;
  }

  return Math.max(limit - currentValue, 0);
}

export function evaluateDailyAvailabilityFromRules(params: {
  rules: AvailabilityRulesContext;
  workload: DailyWorkloadInput;
}): DailyAvailabilityEvaluation {
  const { rules, workload } = params;

  const remainingJobsCapacity = calculateRemainingCapacity(
    rules.max_jobs_per_day,
    workload.total_jobs,
  );

  const remainingInstallationsCapacity = calculateRemainingCapacity(
    rules.max_installations_per_day,
    workload.total_installations,
  );

  const remainingMaintenancesCapacity = calculateRemainingCapacity(
    rules.max_maintenances_per_day,
    workload.total_maintenances,
  );

  if (rules.allow_overbooking) {
    return {
      date: normalizeDateOnly(workload.date),
      can_offer_day: true,
      reason:
        "La sobreagenda está permitida por configuración del usuario. El sistema puede ofrecer el día aunque exista carga previa.",

      total_jobs: workload.total_jobs,
      total_installations: workload.total_installations,
      total_maintenances: workload.total_maintenances,

      max_jobs_per_day: rules.max_jobs_per_day,
      max_installations_per_day: rules.max_installations_per_day,
      max_maintenances_per_day: rules.max_maintenances_per_day,

      remaining_jobs_capacity: remainingJobsCapacity,
      remaining_installations_capacity: remainingInstallationsCapacity,
      remaining_maintenances_capacity: remainingMaintenancesCapacity,

      block_day_if_installation_exists: rules.block_day_if_installation_exists,
      allow_overbooking: rules.allow_overbooking,
    };
  }

  if (rules.block_day_if_installation_exists && workload.has_installation) {
    return {
      date: normalizeDateOnly(workload.date),
      can_offer_day: false,
      reason:
        "El día no se puede ofrecer porque existe una instalación programada y la regla del usuario indica bloquear el día.",

      total_jobs: workload.total_jobs,
      total_installations: workload.total_installations,
      total_maintenances: workload.total_maintenances,

      max_jobs_per_day: rules.max_jobs_per_day,
      max_installations_per_day: rules.max_installations_per_day,
      max_maintenances_per_day: rules.max_maintenances_per_day,

      remaining_jobs_capacity: remainingJobsCapacity,
      remaining_installations_capacity: remainingInstallationsCapacity,
      remaining_maintenances_capacity: remainingMaintenancesCapacity,

      block_day_if_installation_exists: rules.block_day_if_installation_exists,
      allow_overbooking: rules.allow_overbooking,
    };
  }

  if (
    rules.max_jobs_per_day !== null &&
    workload.total_jobs >= rules.max_jobs_per_day
  ) {
    return {
      date: normalizeDateOnly(workload.date),
      can_offer_day: false,
      reason:
        "El día alcanzó la capacidad máxima de trabajos configurada por el usuario.",

      total_jobs: workload.total_jobs,
      total_installations: workload.total_installations,
      total_maintenances: workload.total_maintenances,

      max_jobs_per_day: rules.max_jobs_per_day,
      max_installations_per_day: rules.max_installations_per_day,
      max_maintenances_per_day: rules.max_maintenances_per_day,

      remaining_jobs_capacity: remainingJobsCapacity,
      remaining_installations_capacity: remainingInstallationsCapacity,
      remaining_maintenances_capacity: remainingMaintenancesCapacity,

      block_day_if_installation_exists: rules.block_day_if_installation_exists,
      allow_overbooking: rules.allow_overbooking,
    };
  }

  if (
    rules.max_installations_per_day !== null &&
    workload.total_installations >= rules.max_installations_per_day
  ) {
    return {
      date: normalizeDateOnly(workload.date),
      can_offer_day: false,
      reason:
        "El día alcanzó el máximo de instalaciones configurado por el usuario.",

      total_jobs: workload.total_jobs,
      total_installations: workload.total_installations,
      total_maintenances: workload.total_maintenances,

      max_jobs_per_day: rules.max_jobs_per_day,
      max_installations_per_day: rules.max_installations_per_day,
      max_maintenances_per_day: rules.max_maintenances_per_day,

      remaining_jobs_capacity: remainingJobsCapacity,
      remaining_installations_capacity: remainingInstallationsCapacity,
      remaining_maintenances_capacity: remainingMaintenancesCapacity,

      block_day_if_installation_exists: rules.block_day_if_installation_exists,
      allow_overbooking: rules.allow_overbooking,
    };
  }

  if (
    rules.max_maintenances_per_day !== null &&
    workload.total_maintenances >= rules.max_maintenances_per_day
  ) {
    return {
      date: normalizeDateOnly(workload.date),
      can_offer_day: false,
      reason:
        "El día alcanzó el máximo de mantenimientos configurado por el usuario.",

      total_jobs: workload.total_jobs,
      total_installations: workload.total_installations,
      total_maintenances: workload.total_maintenances,

      max_jobs_per_day: rules.max_jobs_per_day,
      max_installations_per_day: rules.max_installations_per_day,
      max_maintenances_per_day: rules.max_maintenances_per_day,

      remaining_jobs_capacity: remainingJobsCapacity,
      remaining_installations_capacity: remainingInstallationsCapacity,
      remaining_maintenances_capacity: remainingMaintenancesCapacity,

      block_day_if_installation_exists: rules.block_day_if_installation_exists,
      allow_overbooking: rules.allow_overbooking,
    };
  }

  return {
    date: normalizeDateOnly(workload.date),
    can_offer_day: true,
    reason:
      "El día se puede ofrecer según las reglas de agenda configuradas actualmente.",

    total_jobs: workload.total_jobs,
    total_installations: workload.total_installations,
    total_maintenances: workload.total_maintenances,

    max_jobs_per_day: rules.max_jobs_per_day,
    max_installations_per_day: rules.max_installations_per_day,
    max_maintenances_per_day: rules.max_maintenances_per_day,

    remaining_jobs_capacity: remainingJobsCapacity,
    remaining_installations_capacity: remainingInstallationsCapacity,
    remaining_maintenances_capacity: remainingMaintenancesCapacity,

    block_day_if_installation_exists: rules.block_day_if_installation_exists,
    allow_overbooking: rules.allow_overbooking,
  };
}

export async function evaluateDailyAvailability(params: {
  country_code: string;
  workload: DailyWorkloadInput;
}) {
  const rules = await buildAvailabilityRulesContext(params.country_code);

  return evaluateDailyAvailabilityFromRules({
    rules,
    workload: params.workload,
  });
}
