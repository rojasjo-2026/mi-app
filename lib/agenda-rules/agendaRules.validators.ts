import { AgendaRuleScope, AgendaRuleValueType, Prisma } from "@prisma/client";

import type {
  AgendaRuleCreateInput,
  AgendaRulesFilters,
  AgendaRuleUpdateInput,
  NormalizedAgendaRuleCreateInput,
  NormalizedAgendaRuleUpdateInput,
} from "@/lib/agenda-rules/agendaRules.types";

export class AgendaRulesValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AgendaRulesValidationError";
    this.status = status;
  }
}

function normalizeRequiredText(value: unknown, fieldName: string) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    throw new AgendaRulesValidationError(`${fieldName} is required.`);
  }

  return cleanValue;
}

function normalizeOptionalText(value: unknown) {
  const cleanValue = String(value || "").trim();

  return cleanValue || null;
}

export function normalizeCountryCode(value: unknown) {
  const countryCode = String(value || "")
    .trim()
    .toUpperCase();

  if (!countryCode) {
    throw new AgendaRulesValidationError("Country code is required.");
  }

  return countryCode;
}

export function normalizeRuleKey(value: unknown) {
  return normalizeRequiredText(value, "Rule key")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export function normalizeAppliesToKey(value: unknown) {
  return normalizeRequiredText(value, "Applies to key")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export function normalizeRuleScope(value: unknown) {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase();
  const validScopes = Object.values(AgendaRuleScope);

  if (validScopes.includes(normalizedValue as AgendaRuleScope)) {
    return normalizedValue as AgendaRuleScope;
  }

  throw new AgendaRulesValidationError("Invalid agenda rule scope.");
}

export function normalizeValueType(value: unknown) {
  const normalizedValue = String(value || "")
    .trim()
    .toUpperCase();
  const validValueTypes = Object.values(AgendaRuleValueType);

  if (validValueTypes.includes(normalizedValue as AgendaRuleValueType)) {
    return normalizedValue as AgendaRuleValueType;
  }

  throw new AgendaRulesValidationError("Invalid agenda rule value type.");
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }

  return null;
}

function normalizeOptionalBoolean(value: unknown) {
  if (value === undefined) return undefined;

  return normalizeBoolean(value);
}

function normalizeOptionalInteger(value: unknown) {
  if (value === undefined) return undefined;

  const cleanValue = String(value || "").trim();

  if (!cleanValue) return null;

  const parsedValue = Number(cleanValue);

  if (!Number.isFinite(parsedValue) || !Number.isInteger(parsedValue)) {
    throw new AgendaRulesValidationError("Invalid number value.");
  }

  return parsedValue;
}

function normalizeOptionalDecimal(value: unknown) {
  if (value === undefined) return undefined;

  const cleanValue = String(value || "").trim();

  if (!cleanValue) return null;

  const parsedValue = Number(cleanValue);

  if (!Number.isFinite(parsedValue)) {
    throw new AgendaRulesValidationError("Invalid decimal value.");
  }

  return cleanValue;
}

function normalizeOptionalJsonValue(
  value: unknown,
): Prisma.InputJsonValue | null | undefined {
  if (value === undefined) return undefined;

  if (value === null) return null;

  if (typeof value === "string") {
    const cleanValue = value.trim();

    if (!cleanValue) return null;

    try {
      return JSON.parse(cleanValue) as Prisma.InputJsonValue;
    } catch {
      throw new AgendaRulesValidationError("Invalid JSON value.");
    }
  }

  return value as Prisma.InputJsonValue;
}

function normalizeSortOrder(value: unknown) {
  const normalizedValue = normalizeOptionalInteger(value);

  return normalizedValue === undefined ? null : normalizedValue;
}

function validateValueByType(params: {
  value_type: AgendaRuleValueType;
  value_number?: number | null;
  value_decimal?: string | null;
  value_text?: string | null;
  value_boolean?: boolean | null;
  value_json?: Prisma.InputJsonValue | null;
}) {
  if (params.value_type === "NUMBER" && params.value_number === null) {
    throw new AgendaRulesValidationError("Number value is required.");
  }

  if (params.value_type === "DECIMAL" && params.value_decimal === null) {
    throw new AgendaRulesValidationError("Decimal value is required.");
  }

  if (
    (params.value_type === "TEXT" || params.value_type === "SELECT") &&
    !params.value_text
  ) {
    throw new AgendaRulesValidationError("Text value is required.");
  }

  if (params.value_type === "BOOLEAN" && params.value_boolean === null) {
    throw new AgendaRulesValidationError("Boolean value is required.");
  }

  if (params.value_type === "JSON" && params.value_json === null) {
    throw new AgendaRulesValidationError("JSON value is required.");
  }
}

function buildTypedValue(input: {
  value_type: AgendaRuleValueType;
  value_number?: unknown;
  value_decimal?: unknown;
  value_text?: unknown;
  value_boolean?: unknown;
  value_json?: unknown;
}) {
  const valueNumber = normalizeOptionalInteger(input.value_number);
  const valueDecimal = normalizeOptionalDecimal(input.value_decimal);
  const valueText =
    input.value_text === undefined
      ? undefined
      : normalizeOptionalText(input.value_text);
  const valueBoolean = normalizeOptionalBoolean(input.value_boolean);
  const valueJson = normalizeOptionalJsonValue(input.value_json);

  const normalizedValues = {
    value_number: input.value_type === "NUMBER" ? (valueNumber ?? null) : null,
    value_decimal:
      input.value_type === "DECIMAL" ? (valueDecimal ?? null) : null,
    value_text:
      input.value_type === "TEXT" || input.value_type === "SELECT"
        ? (valueText ?? null)
        : null,
    value_boolean:
      input.value_type === "BOOLEAN" ? (valueBoolean ?? null) : null,
    value_json: input.value_type === "JSON" ? (valueJson ?? null) : null,
  };

  validateValueByType({
    value_type: input.value_type,
    ...normalizedValues,
  });

  return normalizedValues;
}

export function normalizeAgendaRuleCreateInput(
  input: AgendaRuleCreateInput,
): NormalizedAgendaRuleCreateInput {
  const valueType = normalizeValueType(input.value_type);

  const typedValue = buildTypedValue({
    value_type: valueType,
    value_number: input.value_number,
    value_decimal: input.value_decimal,
    value_text: input.value_text,
    value_boolean: input.value_boolean,
    value_json: input.value_json,
  });

  return {
    country_code: normalizeCountryCode(input.country_code),

    rule_key: normalizeRuleKey(input.rule_key),
    rule_name: normalizeRequiredText(input.rule_name, "Rule name"),
    rule_description: normalizeOptionalText(input.rule_description),

    rule_scope: normalizeRuleScope(input.rule_scope),
    applies_to_key: normalizeAppliesToKey(input.applies_to_key),
    applies_to_name: normalizeOptionalText(input.applies_to_name),

    value_type: valueType,
    ...typedValue,

    unit: normalizeOptionalText(input.unit),
    notes: normalizeOptionalText(input.notes),
    sort_order: normalizeSortOrder(input.sort_order),
  };
}

export function normalizeAgendaRuleUpdateInput(
  input: AgendaRuleUpdateInput,
): NormalizedAgendaRuleUpdateInput {
  const id = String(input.id || "").trim();

  if (!id) {
    throw new AgendaRulesValidationError("Agenda rule id is required.");
  }

  const normalizedInput: NormalizedAgendaRuleUpdateInput = {
    id,
  };

  if (input.country_code !== undefined) {
    normalizedInput.country_code = normalizeCountryCode(input.country_code);
  }

  if (input.rule_key !== undefined) {
    normalizedInput.rule_key = normalizeRuleKey(input.rule_key);
  }

  if (input.rule_name !== undefined) {
    normalizedInput.rule_name = normalizeRequiredText(
      input.rule_name,
      "Rule name",
    );
  }

  if (input.rule_description !== undefined) {
    normalizedInput.rule_description = normalizeOptionalText(
      input.rule_description,
    );
  }

  if (input.rule_scope !== undefined) {
    normalizedInput.rule_scope = normalizeRuleScope(input.rule_scope);
  }

  if (input.applies_to_key !== undefined) {
    normalizedInput.applies_to_key = normalizeAppliesToKey(
      input.applies_to_key,
    );
  }

  if (input.applies_to_name !== undefined) {
    normalizedInput.applies_to_name = normalizeOptionalText(
      input.applies_to_name,
    );
  }

  if (input.value_type !== undefined) {
    normalizedInput.value_type = normalizeValueType(input.value_type);
  }

  if (input.value_number !== undefined) {
    normalizedInput.value_number = normalizeOptionalInteger(input.value_number);
  }

  if (input.value_decimal !== undefined) {
    normalizedInput.value_decimal = normalizeOptionalDecimal(
      input.value_decimal,
    );
  }

  if (input.value_text !== undefined) {
    normalizedInput.value_text = normalizeOptionalText(input.value_text);
  }

  if (input.value_boolean !== undefined) {
    const valueBoolean = normalizeBoolean(input.value_boolean);

    if (valueBoolean === null) {
      throw new AgendaRulesValidationError("Invalid boolean value.");
    }

    normalizedInput.value_boolean = valueBoolean;
  }

  if (input.value_json !== undefined) {
    normalizedInput.value_json = normalizeOptionalJsonValue(input.value_json);
  }

  if (input.unit !== undefined) {
    normalizedInput.unit = normalizeOptionalText(input.unit);
  }

  if (input.notes !== undefined) {
    normalizedInput.notes = normalizeOptionalText(input.notes);
  }

  if (input.sort_order !== undefined) {
    normalizedInput.sort_order = normalizeSortOrder(input.sort_order);
  }

  if (input.is_active !== undefined) {
    const isActive = normalizeBoolean(input.is_active);

    if (isActive === null) {
      throw new AgendaRulesValidationError("Invalid active value.");
    }

    normalizedInput.is_active = isActive;
  }

  return normalizedInput;
}

export function validateMergedAgendaRuleValue(params: {
  value_type: AgendaRuleValueType;
  value_number: number | null;
  value_decimal: string | null;
  value_text: string | null;
  value_boolean: boolean | null;
  value_json: Prisma.InputJsonValue | null;
}) {
  validateValueByType(params);
}

export function normalizeAgendaRulesFilters(
  searchParams: URLSearchParams,
): AgendaRulesFilters {
  const countryCode = searchParams.get("country_code");
  const ruleKey = searchParams.get("rule_key");
  const ruleScope = searchParams.get("rule_scope");
  const appliesToKey = searchParams.get("applies_to_key");
  const activeOnly = searchParams.get("active_only");

  return {
    ...(countryCode ? { country_code: normalizeCountryCode(countryCode) } : {}),
    ...(ruleKey ? { rule_key: normalizeRuleKey(ruleKey) } : {}),
    ...(ruleScope ? { rule_scope: normalizeRuleScope(ruleScope) } : {}),
    ...(appliesToKey
      ? { applies_to_key: normalizeAppliesToKey(appliesToKey) }
      : {}),
    ...(activeOnly === "true" ? { active_only: true } : {}),
  };
}
