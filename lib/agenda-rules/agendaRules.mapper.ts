import type {
  AgendaRuleRecord,
  AgendaRuleResponse,
} from "@/lib/agenda-rules/agendaRules.types";

export function mapAgendaRule(rule: AgendaRuleRecord): AgendaRuleResponse {
  return {
    id: rule.agenda_rule_id,

    country_code: rule.country_code,

    rule_key: rule.rule_key,
    rule_name: rule.rule_name,
    rule_description: rule.rule_description,

    rule_scope: rule.rule_scope,
    applies_to_key: rule.applies_to_key,
    applies_to_name: rule.applies_to_name,

    value_type: rule.value_type,
    value_number: rule.value_number,
    value_decimal: rule.value_decimal ? rule.value_decimal.toString() : null,
    value_text: rule.value_text,
    value_boolean: rule.value_boolean,
    value_json: rule.value_json,

    unit: rule.unit,
    notes: rule.notes,
    sort_order: rule.sort_order,

    is_active: rule.is_active,

    created_at: rule.created_at.toISOString(),
    updated_at: rule.updated_at.toISOString(),
  };
}

export function mapAgendaRules(
  rules: AgendaRuleRecord[],
): AgendaRuleResponse[] {
  return rules.map(mapAgendaRule);
}
