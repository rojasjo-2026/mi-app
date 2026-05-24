import type {
  AgendaRuleScope,
  AgendaRuleValueType,
  Prisma,
} from "@prisma/client";

export type AgendaRuleRecord = {
  agenda_rule_id: string;

  country_code: string;

  rule_key: string;
  rule_name: string;
  rule_description: string | null;

  rule_scope: AgendaRuleScope;
  applies_to_key: string;
  applies_to_name: string | null;

  value_type: AgendaRuleValueType;
  value_number: number | null;
  value_decimal: Prisma.Decimal | null;
  value_text: string | null;
  value_boolean: boolean | null;
  value_json: Prisma.JsonValue | null;

  unit: string | null;
  notes: string | null;
  sort_order: number | null;

  is_active: boolean;

  created_at: Date;
  updated_at: Date;
};

export type AgendaRuleResponse = {
  id: string;

  country_code: string;

  rule_key: string;
  rule_name: string;
  rule_description: string | null;

  rule_scope: AgendaRuleScope;
  applies_to_key: string;
  applies_to_name: string | null;

  value_type: AgendaRuleValueType;
  value_number: number | null;
  value_decimal: string | null;
  value_text: string | null;
  value_boolean: boolean | null;
  value_json: Prisma.JsonValue | null;

  unit: string | null;
  notes: string | null;
  sort_order: number | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
};

export type AgendaRulesApiResponse = {
  success: boolean;
  data?: AgendaRuleResponse[] | AgendaRuleResponse | { id: string };
  message?: string;
};

export type AgendaRuleCreateInput = {
  country_code?: unknown;

  rule_key?: unknown;
  rule_name?: unknown;
  rule_description?: unknown;

  rule_scope?: unknown;
  applies_to_key?: unknown;
  applies_to_name?: unknown;

  value_type?: unknown;
  value_number?: unknown;
  value_decimal?: unknown;
  value_text?: unknown;
  value_boolean?: unknown;
  value_json?: unknown;

  unit?: unknown;
  notes?: unknown;
  sort_order?: unknown;
};

export type AgendaRuleUpdateInput = AgendaRuleCreateInput & {
  id?: unknown;
  is_active?: unknown;
};

export type NormalizedAgendaRuleCreateInput = {
  country_code: string;

  rule_key: string;
  rule_name: string;
  rule_description: string | null;

  rule_scope: AgendaRuleScope;
  applies_to_key: string;
  applies_to_name: string | null;

  value_type: AgendaRuleValueType;
  value_number: number | null;
  value_decimal: string | null;
  value_text: string | null;
  value_boolean: boolean | null;
  value_json: Prisma.InputJsonValue | null;

  unit: string | null;
  notes: string | null;
  sort_order: number | null;
};

export type NormalizedAgendaRuleUpdateInput = {
  id: string;

  country_code?: string;

  rule_key?: string;
  rule_name?: string;
  rule_description?: string | null;

  rule_scope?: AgendaRuleScope;
  applies_to_key?: string;
  applies_to_name?: string | null;

  value_type?: AgendaRuleValueType;
  value_number?: number | null;
  value_decimal?: string | null;
  value_text?: string | null;
  value_boolean?: boolean | null;
  value_json?: Prisma.InputJsonValue | null;

  unit?: string | null;
  notes?: string | null;
  sort_order?: number | null;

  is_active?: boolean;
};

export type AgendaRulesFilters = {
  country_code?: string;
  rule_key?: string;
  rule_scope?: AgendaRuleScope;
  applies_to_key?: string;
  active_only?: boolean;
};

export type AgendaRulesServiceResult<T> = {
  status: number;
  body: {
    success: boolean;
    data?: T;
    message?: string;
  };
};
