import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  mapAgendaRule,
  mapAgendaRules,
} from "@/lib/agenda-rules/agendaRules.mapper";

import type {
  AgendaRuleCreateInput,
  AgendaRuleResponse,
  AgendaRulesFilters,
  AgendaRulesServiceResult,
  AgendaRuleUpdateInput,
} from "@/lib/agenda-rules/agendaRules.types";

import {
  AgendaRulesValidationError,
  normalizeAgendaRuleCreateInput,
  normalizeAgendaRuleUpdateInput,
  validateMergedAgendaRuleValue,
} from "@/lib/agenda-rules/agendaRules.validators";

function buildValidationErrorResponse(error: AgendaRulesValidationError) {
  return {
    status: error.status,
    body: {
      success: false,
      message: error.message,
    },
  };
}

function toNullableJsonInput(value: Prisma.InputJsonValue | null) {
  return value === null ? Prisma.DbNull : value;
}

export async function getAgendaRules(
  filters: AgendaRulesFilters,
): Promise<AgendaRulesServiceResult<AgendaRuleResponse[]>> {
  const rules = await prisma.agendaRule.findMany({
    where: {
      ...(filters.country_code ? { country_code: filters.country_code } : {}),
      ...(filters.rule_key ? { rule_key: filters.rule_key } : {}),
      ...(filters.rule_scope ? { rule_scope: filters.rule_scope } : {}),
      ...(filters.applies_to_key
        ? { applies_to_key: filters.applies_to_key }
        : {}),
      ...(filters.active_only ? { is_active: true } : {}),
    },
    orderBy: [
      { country_code: "asc" },
      { sort_order: "asc" },
      { rule_name: "asc" },
    ],
  });

  return {
    status: 200,
    body: {
      success: true,
      data: mapAgendaRules(rules),
      message:
        rules.length === 0
          ? "No agenda rules have been configured yet."
          : undefined,
    },
  };
}

export async function createAgendaRule(
  input: AgendaRuleCreateInput,
): Promise<AgendaRulesServiceResult<AgendaRuleResponse>> {
  try {
    const normalizedInput = normalizeAgendaRuleCreateInput(input);

    const existingRule = await prisma.agendaRule.findFirst({
      where: {
        country_code: normalizedInput.country_code,
        rule_key: normalizedInput.rule_key,
        rule_scope: normalizedInput.rule_scope,
        applies_to_key: normalizedInput.applies_to_key,
      },
    });

    if (existingRule) {
      return {
        status: 409,
        body: {
          success: false,
          message:
            "An agenda rule already exists for this country, key, scope and target.",
          data: mapAgendaRule(existingRule),
        },
      };
    }

    const createdRule = await prisma.agendaRule.create({
      data: {
        country_code: normalizedInput.country_code,

        rule_key: normalizedInput.rule_key,
        rule_name: normalizedInput.rule_name,
        rule_description: normalizedInput.rule_description,

        rule_scope: normalizedInput.rule_scope,
        applies_to_key: normalizedInput.applies_to_key,
        applies_to_name: normalizedInput.applies_to_name,

        value_type: normalizedInput.value_type,
        value_number: normalizedInput.value_number,
        value_decimal: normalizedInput.value_decimal,
        value_text: normalizedInput.value_text,
        value_boolean: normalizedInput.value_boolean,
        value_json: toNullableJsonInput(normalizedInput.value_json),

        unit: normalizedInput.unit,
        notes: normalizedInput.notes,
        sort_order: normalizedInput.sort_order,

        is_active: true,
      },
    });

    return {
      status: 201,
      body: {
        success: true,
        data: mapAgendaRule(createdRule),
      },
    };
  } catch (error) {
    if (error instanceof AgendaRulesValidationError) {
      return buildValidationErrorResponse(error);
    }

    throw error;
  }
}

export async function updateAgendaRule(
  input: AgendaRuleUpdateInput,
): Promise<AgendaRulesServiceResult<AgendaRuleResponse>> {
  try {
    const normalizedInput = normalizeAgendaRuleUpdateInput(input);

    const currentRule = await prisma.agendaRule.findUnique({
      where: {
        agenda_rule_id: normalizedInput.id,
      },
    });

    if (!currentRule) {
      return {
        status: 404,
        body: {
          success: false,
          message: "Agenda rule not found.",
        },
      };
    }

    const nextValues = {
      country_code: normalizedInput.country_code ?? currentRule.country_code,

      rule_key: normalizedInput.rule_key ?? currentRule.rule_key,
      rule_name: normalizedInput.rule_name ?? currentRule.rule_name,
      rule_description:
        normalizedInput.rule_description !== undefined
          ? normalizedInput.rule_description
          : currentRule.rule_description,

      rule_scope: normalizedInput.rule_scope ?? currentRule.rule_scope,
      applies_to_key:
        normalizedInput.applies_to_key ?? currentRule.applies_to_key,
      applies_to_name:
        normalizedInput.applies_to_name !== undefined
          ? normalizedInput.applies_to_name
          : currentRule.applies_to_name,

      value_type: normalizedInput.value_type ?? currentRule.value_type,
      value_number:
        normalizedInput.value_number !== undefined
          ? normalizedInput.value_number
          : currentRule.value_number,
      value_decimal:
        normalizedInput.value_decimal !== undefined
          ? normalizedInput.value_decimal
          : (currentRule.value_decimal?.toString() ?? null),
      value_text:
        normalizedInput.value_text !== undefined
          ? normalizedInput.value_text
          : currentRule.value_text,
      value_boolean:
        normalizedInput.value_boolean !== undefined
          ? normalizedInput.value_boolean
          : currentRule.value_boolean,
      value_json:
        normalizedInput.value_json !== undefined
          ? normalizedInput.value_json
          : (currentRule.value_json as Prisma.InputJsonValue | null),

      unit:
        normalizedInput.unit !== undefined
          ? normalizedInput.unit
          : currentRule.unit,
      notes:
        normalizedInput.notes !== undefined
          ? normalizedInput.notes
          : currentRule.notes,
      sort_order:
        normalizedInput.sort_order !== undefined
          ? normalizedInput.sort_order
          : currentRule.sort_order,

      is_active:
        normalizedInput.is_active !== undefined
          ? normalizedInput.is_active
          : currentRule.is_active,
    };

    const normalizedTypedValues = {
      value_number:
        nextValues.value_type === "NUMBER" ? nextValues.value_number : null,
      value_decimal:
        nextValues.value_type === "DECIMAL" ? nextValues.value_decimal : null,
      value_text:
        nextValues.value_type === "TEXT" || nextValues.value_type === "SELECT"
          ? nextValues.value_text
          : null,
      value_boolean:
        nextValues.value_type === "BOOLEAN" ? nextValues.value_boolean : null,
      value_json:
        nextValues.value_type === "JSON" ? nextValues.value_json : null,
    };

    validateMergedAgendaRuleValue({
      value_type: nextValues.value_type,
      ...normalizedTypedValues,
    });

    const duplicateRule = await prisma.agendaRule.findFirst({
      where: {
        country_code: nextValues.country_code,
        rule_key: nextValues.rule_key,
        rule_scope: nextValues.rule_scope,
        applies_to_key: nextValues.applies_to_key,
        NOT: {
          agenda_rule_id: normalizedInput.id,
        },
      },
    });

    if (duplicateRule) {
      return {
        status: 409,
        body: {
          success: false,
          message:
            "Another agenda rule already exists for this country, key, scope and target.",
        },
      };
    }

    const updatedRule = await prisma.agendaRule.update({
      where: {
        agenda_rule_id: normalizedInput.id,
      },
      data: {
        country_code: nextValues.country_code,

        rule_key: nextValues.rule_key,
        rule_name: nextValues.rule_name,
        rule_description: nextValues.rule_description,

        rule_scope: nextValues.rule_scope,
        applies_to_key: nextValues.applies_to_key,
        applies_to_name: nextValues.applies_to_name,

        value_type: nextValues.value_type,
        value_number: normalizedTypedValues.value_number,
        value_decimal: normalizedTypedValues.value_decimal,
        value_text: normalizedTypedValues.value_text,
        value_boolean: normalizedTypedValues.value_boolean,
        value_json: toNullableJsonInput(normalizedTypedValues.value_json),

        unit: nextValues.unit,
        notes: nextValues.notes,
        sort_order: nextValues.sort_order,

        is_active: nextValues.is_active,
      },
    });

    return {
      status: 200,
      body: {
        success: true,
        data: mapAgendaRule(updatedRule),
      },
    };
  } catch (error) {
    if (error instanceof AgendaRulesValidationError) {
      return buildValidationErrorResponse(error);
    }

    throw error;
  }
}

export async function deleteAgendaRule(
  id: unknown,
): Promise<AgendaRulesServiceResult<{ id: string }>> {
  const cleanId = String(id || "").trim();

  if (!cleanId) {
    return {
      status: 400,
      body: {
        success: false,
        message: "Agenda rule id is required.",
      },
    };
  }

  const existingRule = await prisma.agendaRule.findUnique({
    where: {
      agenda_rule_id: cleanId,
    },
  });

  if (!existingRule) {
    return {
      status: 404,
      body: {
        success: false,
        message: "Agenda rule not found.",
      },
    };
  }

  await prisma.agendaRule.delete({
    where: {
      agenda_rule_id: cleanId,
    },
  });

  return {
    status: 200,
    body: {
      success: true,
      data: {
        id: cleanId,
      },
    },
  };
}
