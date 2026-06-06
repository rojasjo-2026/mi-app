import {
  ruleTemplates,
  unitLabels,
  type AgendaRule,
  type AgendaRuleForm,
  type RuleTemplate,
} from "./agendaRulesConfig";

export function getTemplate(ruleKey: string | null | undefined) {
  return (
    ruleTemplates.find((template) => template.rule_key === ruleKey) ?? null
  );
}

export function buildEmptyFormFromRule(rule: AgendaRule): AgendaRuleForm {
  return {
    value_number: rule.value_number !== null ? String(rule.value_number) : "",
    value_decimal: rule.value_decimal || "",
    value_text: rule.value_text || "",
    value_boolean:
      rule.value_boolean === null ? "" : rule.value_boolean ? "true" : "false",
    value_json: rule.value_json ? JSON.stringify(rule.value_json, null, 2) : "",
    notes: rule.notes || "",
  };
}

export function formatRuleValue(rule: AgendaRule) {
  const unitLabel = rule.unit
    ? unitLabels[rule.unit] || rule.unit.toLowerCase()
    : "";

  if (rule.value_type === "NUMBER") {
    return rule.value_number !== null
      ? `${rule.value_number}${unitLabel ? ` ${unitLabel}` : ""}`
      : "Sin valor";
  }

  if (rule.value_type === "DECIMAL") {
    return rule.value_decimal
      ? `${rule.value_decimal}${unitLabel ? ` ${unitLabel}` : ""}`
      : "Sin valor";
  }

  if (rule.value_type === "BOOLEAN") {
    if (rule.value_boolean === null) return "Sin valor";
    return rule.value_boolean ? "Sí" : "No";
  }

  if (rule.value_type === "JSON") {
    return rule.value_json ? "Configuración avanzada definida" : "Sin valor";
  }

  return rule.value_text || "Sin valor";
}

export function validateForm(form: AgendaRuleForm, template: RuleTemplate | null) {
  if (!template) {
    return "Seleccione una regla de la lista antes de guardar.";
  }

  if (template.value_type === "NUMBER") {
    if (!form.value_number.trim()) {
      return `Ingrese un número para: ${template.value_label}.`;
    }

    const parsedValue = Number(form.value_number);

    if (!Number.isFinite(parsedValue) || !Number.isInteger(parsedValue)) {
      return "Ingrese un número entero válido.";
    }

    if (parsedValue < 0) {
      return "El valor no puede ser negativo.";
    }
  }

  if (template.value_type === "DECIMAL") {
    if (!form.value_decimal.trim()) {
      return `Ingrese un valor decimal para: ${template.value_label}.`;
    }

    const parsedValue = Number(form.value_decimal);

    if (!Number.isFinite(parsedValue)) {
      return "Ingrese un valor decimal válido.";
    }
  }

  if (
    (template.value_type === "TEXT" || template.value_type === "SELECT") &&
    !form.value_text.trim()
  ) {
    return `Ingrese un valor para: ${template.value_label}.`;
  }

  if (template.value_type === "BOOLEAN" && !form.value_boolean) {
    return `Seleccione Sí o No para: ${template.value_label}.`;
  }

  if (template.value_type === "JSON") {
    if (!form.value_json.trim()) {
      return "Ingrese una configuración avanzada.";
    }

    try {
      JSON.parse(form.value_json);
    } catch {
      return "La configuración avanzada no tiene un formato válido.";
    }
  }

  return "";
}

export function buildPayload(
  form: AgendaRuleForm,
  countryCode: string,
  template: RuleTemplate,
) {
  return {
    country_code: countryCode.trim().toUpperCase(),
    rule_key: template.rule_key,
    rule_name: template.rule_name,
    rule_description: template.rule_description,
    rule_scope: template.rule_scope,
    applies_to_key: template.applies_to_key,
    applies_to_name: template.applies_to_name,
    value_type: template.value_type,

    value_number:
      template.value_type === "NUMBER" ? Number(form.value_number) : null,

    value_decimal:
      template.value_type === "DECIMAL" ? form.value_decimal.trim() : null,

    value_text:
      template.value_type === "TEXT" || template.value_type === "SELECT"
        ? form.value_text.trim()
        : null,

    value_boolean:
      template.value_type === "BOOLEAN" ? form.value_boolean === "true" : null,

    value_json:
      template.value_type === "JSON" ? JSON.parse(form.value_json) : null,

    unit: template.unit || null,
    notes: form.notes.trim() || null,
    sort_order: null,
  };
}

export function toFriendlyError(message: string) {
  if (message.toLowerCase().includes("clave de regla")) {
    return "Seleccione una regla de la lista antes de guardar.";
  }

  if (
    message.toLowerCase().includes("already exists") ||
    message.includes("Ya existe")
  ) {
    return "Esta regla ya existe para el país seleccionado. Puede editarla en la lista de reglas activas.";
  }

  return message;
}

