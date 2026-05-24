"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AgendaRuleScope = "GLOBAL" | "WORK_CATEGORY" | "WORK_TYPE" | "ZONE";

type AgendaRuleValueType =
  | "NUMBER"
  | "DECIMAL"
  | "BOOLEAN"
  | "TEXT"
  | "SELECT"
  | "JSON";

type ValueFieldKey = "value_number" | "value_decimal" | "value_text";

type AgendaRule = {
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
  value_json: unknown | null;
  unit: string | null;
  notes: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AgendaRulesApiResponse = {
  success: boolean;
  data?: AgendaRule[] | AgendaRule | { id: string };
  message?: string;
};

type AgendaRuleForm = {
  value_number: string;
  value_decimal: string;
  value_text: string;
  value_boolean: "" | "true" | "false";
  value_json: string;
  notes: string;
};

type AgendaRulesManagerProps = {
  countryCode: string;
  countryName: string;
};

type RuleTemplate = {
  rule_key: string;
  rule_name: string;
  rule_description: string;
  rule_scope: AgendaRuleScope;
  applies_to_key: string;
  applies_to_name: string;
  value_type: AgendaRuleValueType;
  unit: string;
  unit_label: string;
  value_label: string;
  value_placeholder: string;
  value_help: string;
  help_text: string;
};

const emptyForm: AgendaRuleForm = {
  value_number: "",
  value_decimal: "",
  value_text: "",
  value_boolean: "",
  value_json: "",
  notes: "",
};

const ruleTemplates: RuleTemplate[] = [
  {
    rule_key: "MAX_JOBS_PER_DAY",
    rule_name: "Capacidad de trabajo diario",
    rule_description:
      "Define cuántos trabajos máximos se pueden permitir en un mismo día según la operación de la empresa.",
    rule_scope: "GLOBAL",
    applies_to_key: "GLOBAL",
    applies_to_name: "General",
    value_type: "NUMBER",
    unit: "JOBS",
    unit_label: "trabajos",
    value_label: "Cantidad máxima de trabajos por día",
    value_placeholder: "Ej. 4",
    value_help:
      "Ingrese la cantidad máxima de trabajos que la empresa quiere permitir en un mismo día. CLARIUS no impone este número.",
    help_text:
      "Úsela si desea que CLARIUS considere un límite general de trabajos por día cuando el motor de disponibilidad esté activo.",
  },
  {
    rule_key: "MIN_TIME_BETWEEN_JOBS",
    rule_name: "Tiempo mínimo entre trabajos",
    rule_description:
      "Define el tiempo mínimo que debe existir entre un trabajo programado y otro.",
    rule_scope: "GLOBAL",
    applies_to_key: "GLOBAL",
    applies_to_name: "General",
    value_type: "NUMBER",
    unit: "MINUTES",
    unit_label: "minutos",
    value_label: "Minutos mínimos entre trabajos",
    value_placeholder: "Ej. 60",
    value_help:
      "Ingrese minutos. Por ejemplo, 60 significa dejar una hora entre un trabajo programado y otro.",
    help_text:
      "El usuario define el tiempo según su operación. CLARIUS no impone una duración fija.",
  },
  {
    rule_key: "BLOCK_DAY_IF_INSTALLATION_EXISTS",
    rule_name: "Bloquear día si existe una instalación",
    rule_description:
      "Indica si el sistema debe considerar el día como no disponible cuando ya existe una instalación programada.",
    rule_scope: "WORK_CATEGORY",
    applies_to_key: "INSTALLATION",
    applies_to_name: "Instalaciones",
    value_type: "BOOLEAN",
    unit: "",
    unit_label: "",
    value_label: "¿Una instalación bloquea el resto del día?",
    value_placeholder: "",
    value_help:
      "Seleccione Sí si una instalación debe hacer que ese día ya no se ofrezca para otros servicios.",
    help_text:
      "Úsela si una instalación consume suficiente capacidad como para no ofrecer más servicios ese día.",
  },
  {
    rule_key: "MAX_INSTALLATIONS_PER_DAY",
    rule_name: "Máximo de instalaciones por día",
    rule_description:
      "Define cuántas instalaciones máximas se pueden permitir en un mismo día.",
    rule_scope: "WORK_CATEGORY",
    applies_to_key: "INSTALLATION",
    applies_to_name: "Instalaciones",
    value_type: "NUMBER",
    unit: "JOBS",
    unit_label: "instalaciones",
    value_label: "Cantidad máxima de instalaciones por día",
    value_placeholder: "Ej. 1",
    value_help:
      "Ingrese cuántas instalaciones como máximo se pueden programar en un mismo día.",
    help_text:
      "Úsela si desea limitar la cantidad de instalaciones permitidas por día.",
  },
  {
    rule_key: "MAX_MAINTENANCES_PER_DAY",
    rule_name: "Máximo de mantenimientos por día",
    rule_description:
      "Define cuántos mantenimientos máximos se pueden permitir en un mismo día.",
    rule_scope: "WORK_CATEGORY",
    applies_to_key: "MAINTENANCE",
    applies_to_name: "Mantenimientos",
    value_type: "NUMBER",
    unit: "JOBS",
    unit_label: "mantenimientos",
    value_label: "Cantidad máxima de mantenimientos por día",
    value_placeholder: "Ej. 6",
    value_help:
      "Ingrese cuántos mantenimientos como máximo se pueden programar en un mismo día.",
    help_text:
      "Úsela si desea limitar la cantidad de mantenimientos permitidos por día.",
  },
  {
    rule_key: "ALLOW_OVERBOOKING",
    rule_name: "Permitir sobreagenda",
    rule_description:
      "Indica si el sistema puede permitir agendar por encima de la capacidad configurada.",
    rule_scope: "GLOBAL",
    applies_to_key: "GLOBAL",
    applies_to_name: "General",
    value_type: "BOOLEAN",
    unit: "",
    unit_label: "",
    value_label: "¿Permitir agenda por encima de la capacidad?",
    value_placeholder: "",
    value_help:
      "Seleccione Sí solo si la empresa permite excepciones manuales cuando un día ya está lleno según sus reglas.",
    help_text:
      "Active esta regla solo si la empresa permite excepciones manuales de agenda.",
  },
  {
    rule_key: "GROUP_BY_ZONE",
    rule_name: "Agrupar trabajos por zona",
    rule_description:
      "Indica si el sistema debe intentar agrupar trabajos cercanos por zona cuando sea posible.",
    rule_scope: "GLOBAL",
    applies_to_key: "GLOBAL",
    applies_to_name: "General",
    value_type: "BOOLEAN",
    unit: "",
    unit_label: "",
    value_label: "¿Agrupar trabajos por zona cuando sea posible?",
    value_placeholder: "",
    value_help:
      "Seleccione Sí si desea preparar la agenda para sugerir trabajos cercanos por zona.",
    help_text:
      "Esta regla ayuda a preparar una futura lógica de rutas y disponibilidad por zona.",
  },
  {
    rule_key: "PRIORITIZE_OVERDUE_MAINTENANCE",
    rule_name: "Priorizar mantenimientos vencidos",
    rule_description:
      "Indica si los mantenimientos vencidos deben tener prioridad al sugerir disponibilidad.",
    rule_scope: "GLOBAL",
    applies_to_key: "GLOBAL",
    applies_to_name: "General",
    value_type: "BOOLEAN",
    unit: "",
    unit_label: "",
    value_label: "¿Priorizar mantenimientos vencidos?",
    value_placeholder: "",
    value_help:
      "Seleccione Sí si desea que los mantenimientos atrasados tengan prioridad operativa.",
    help_text:
      "Úsela si desea que los mantenimientos atrasados tengan prioridad operativa.",
  },
];

const scopeLabels: Record<AgendaRuleScope, string> = {
  GLOBAL: "Global",
  WORK_CATEGORY: "Categoría de trabajo",
  WORK_TYPE: "Tipo de trabajo",
  ZONE: "Zona",
};

const valueTypeLabels: Record<AgendaRuleValueType, string> = {
  NUMBER: "Número entero",
  DECIMAL: "Número decimal",
  BOOLEAN: "Sí / No",
  TEXT: "Texto",
  SELECT: "Selección",
  JSON: "Configuración avanzada",
};

const unitLabels: Record<string, string> = {
  JOBS: "trabajos",
  MINUTES: "minutos",
  DAYS: "días",
};

function getTemplate(ruleKey: string | null | undefined) {
  return (
    ruleTemplates.find((template) => template.rule_key === ruleKey) ?? null
  );
}

function buildEmptyFormFromRule(rule: AgendaRule): AgendaRuleForm {
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

function formatRuleValue(rule: AgendaRule) {
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

function validateForm(form: AgendaRuleForm, template: RuleTemplate | null) {
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

function buildPayload(
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

function toFriendlyError(message: string) {
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

export default function AgendaRulesManager({
  countryCode,
  countryName,
}: AgendaRulesManagerProps) {
  const ruleSelectRef = useRef<HTMLSelectElement | null>(null);

  const [rules, setRules] = useState<AgendaRule[]>([]);
  const [selectedRuleKey, setSelectedRuleKey] = useState("");
  const [form, setForm] = useState<AgendaRuleForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<RuleTemplate | null>(
    null,
  );
  const [editingForm, setEditingForm] = useState<AgendaRuleForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedTemplate = useMemo(
    () => getTemplate(selectedRuleKey),
    [selectedRuleKey],
  );

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.is_active),
    [rules],
  );

  const inactiveRules = useMemo(
    () => rules.filter((rule) => !rule.is_active),
    [rules],
  );

  function clearMessages() {
    setError("");
    setSuccessMessage("");
  }

  function getTemplateForCreate() {
    const keyFromState = selectedRuleKey?.trim() || "";
    const keyFromDom = ruleSelectRef.current?.value?.trim() || "";
    const textFromDom =
      ruleSelectRef.current?.selectedOptions?.[0]?.textContent?.trim() || "";

    const templateFromState = getTemplate(keyFromState);
    const templateFromDom = getTemplate(keyFromDom);
    const templateFromText =
      ruleTemplates.find((template) => template.rule_name === textFromDom) ??
      null;

    return templateFromState ?? templateFromDom ?? templateFromText;
  }

  function handleRuleSelection(ruleKey: string) {
    clearMessages();
    setSelectedRuleKey(ruleKey);
    setForm(emptyForm);
  }

  function handleFormChange(nextForm: AgendaRuleForm) {
    clearMessages();
    setForm(nextForm);
  }

  function handleEditingFormChange(nextForm: AgendaRuleForm) {
    clearMessages();
    setEditingForm(nextForm);
  }

  async function loadRules() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/agenda-rules?country_code=${encodeURIComponent(countryCode)}`,
        { cache: "no-store" },
      );

      const result: AgendaRulesApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar las reglas de agenda.",
        );
      }

      setRules(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? toFriendlyError(err.message)
          : "Ocurrió un error al cargar las reglas de agenda.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRule() {
    const currentTemplate = getTemplateForCreate();

    const validationMessage = validateForm(form, currentTemplate);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (!currentTemplate) {
      setError("Seleccione una regla de la lista antes de guardar.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      setSelectedRuleKey(currentTemplate.rule_key);

      const payload = buildPayload(form, countryCode, currentTemplate);

      const response = await fetch("/api/agenda-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: AgendaRulesApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo crear la regla de agenda.",
        );
      }

      setSelectedRuleKey("");
      setForm(emptyForm);

      if (ruleSelectRef.current) {
        ruleSelectRef.current.value = "";
      }

      setSuccessMessage("Regla de agenda creada correctamente.");
      await loadRules();
    } catch (err) {
      setError(
        err instanceof Error
          ? toFriendlyError(err.message)
          : "Ocurrió un error al crear la regla de agenda.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit(rule: AgendaRule) {
    const template = getTemplate(rule.rule_key);

    setEditingId(rule.id);
    setEditingTemplate(template);
    setEditingForm(buildEmptyFormFromRule(rule));
    setError("");
    setSuccessMessage("");
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingTemplate(null);
    setEditingForm(emptyForm);
    setError("");
  }

  async function handleUpdateRule(id: string) {
    const validationMessage = validateForm(editingForm, editingTemplate);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (!editingTemplate) {
      setError("No se pudo identificar la regla que desea editar.");
      return;
    }

    try {
      setUpdatingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/agenda-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...buildPayload(editingForm, countryCode, editingTemplate),
        }),
      });

      const result: AgendaRulesApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo actualizar la regla de agenda.",
        );
      }

      setEditingId(null);
      setEditingTemplate(null);
      setEditingForm(emptyForm);
      setSuccessMessage("Regla de agenda actualizada correctamente.");
      await loadRules();
    } catch (err) {
      setError(
        err instanceof Error
          ? toFriendlyError(err.message)
          : "Ocurrió un error al actualizar la regla de agenda.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleActive(rule: AgendaRule) {
    try {
      setUpdatingId(rule.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/agenda-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rule.id,
          is_active: !rule.is_active,
        }),
      });

      const result: AgendaRulesApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo cambiar el estado de la regla.",
        );
      }

      setSuccessMessage(
        rule.is_active
          ? "Regla de agenda desactivada correctamente."
          : "Regla de agenda activada correctamente.",
      );

      await loadRules();
    } catch (err) {
      setError(
        err instanceof Error
          ? toFriendlyError(err.message)
          : "Ocurrió un error al cambiar el estado de la regla.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteRule(id: string) {
    const confirmed = window.confirm(
      "¿Seguro que desea eliminar esta regla de agenda?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/agenda-rules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result: AgendaRulesApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo eliminar la regla de agenda.",
        );
      }

      setSuccessMessage("Regla de agenda eliminada correctamente.");
      await loadRules();
    } catch (err) {
      setError(
        err instanceof Error
          ? toFriendlyError(err.message)
          : "Ocurrió un error al eliminar la regla de agenda.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    setSelectedRuleKey("");
    setForm(emptyForm);
    setEditingId(null);
    setEditingTemplate(null);
    setEditingForm(emptyForm);

    if (ruleSelectRef.current) {
      ruleSelectRef.current.value = "";
    }

    void loadRules();
  }, [countryCode]);

  function renderRuleInfo(template: RuleTemplate | null) {
    if (!template) return null;

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 lg:col-span-2">
        <p className="font-semibold text-slate-800">{template.rule_name}</p>

        <p className="mt-1">{template.rule_description}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-semibold text-blue-700">
            {scopeLabels[template.rule_scope]}
          </span>

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            {valueTypeLabels[template.value_type]}
          </span>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
            Aplica a: {template.applies_to_name}
          </span>

          {template.unit_label ? (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600">
              Unidad: {template.unit_label}
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-slate-500">{template.help_text}</p>
      </div>
    );
  }

  function renderValueInput(
    currentForm: AgendaRuleForm,
    onChange: (nextForm: AgendaRuleForm) => void,
    template: RuleTemplate | null,
  ) {
    if (!template) return null;

    if (template.value_type === "BOOLEAN") {
      return (
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            {template.value_label}
          </span>

          <select
            value={currentForm.value_boolean}
            onChange={(event) =>
              onChange({
                ...currentForm,
                value_boolean: event.target.value as "" | "true" | "false",
              })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          >
            <option value="">Seleccione...</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>

          <p className="text-xs leading-5 text-slate-400">
            {template.value_help}
          </p>
        </label>
      );
    }

    if (template.value_type === "JSON") {
      return (
        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            {template.value_label}
          </span>

          <textarea
            rows={4}
            value={currentForm.value_json}
            onChange={(event) =>
              onChange({
                ...currentForm,
                value_json: event.target.value,
              })
            }
            placeholder={template.value_placeholder}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />

          <p className="text-xs leading-5 text-slate-400">
            {template.value_help}
          </p>
        </label>
      );
    }

    const valueField: ValueFieldKey =
      template.value_type === "NUMBER"
        ? "value_number"
        : template.value_type === "DECIMAL"
          ? "value_decimal"
          : "value_text";

    const inputType =
      template.value_type === "NUMBER" || template.value_type === "DECIMAL"
        ? "number"
        : "text";

    return (
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          {template.value_label}
        </span>

        <input
          type={inputType}
          step={template.value_type === "DECIMAL" ? "0.01" : undefined}
          value={currentForm[valueField]}
          onChange={(event) =>
            onChange({
              ...currentForm,
              [valueField]: event.target.value,
            })
          }
          placeholder={template.value_placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
        />

        <p className="text-xs leading-5 text-slate-400">
          {template.value_help}
        </p>
      </label>
    );
  }

  function renderFormFields(params: {
    currentForm: AgendaRuleForm;
    onChange: (nextForm: AgendaRuleForm) => void;
    template: RuleTemplate | null;
    showSelector: boolean;
  }) {
    const { currentForm, onChange, template, showSelector } = params;

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 lg:col-span-2">
          País operativo: {countryName} ({countryCode})
        </div>

        {showSelector ? (
          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Regla a configurar
            </span>

            <select
              ref={ruleSelectRef}
              value={selectedRuleKey}
              onChange={(event) => handleRuleSelection(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="">Seleccione una regla...</option>

              {ruleTemplates.map((ruleTemplate) => (
                <option
                  key={ruleTemplate.rule_key}
                  value={ruleTemplate.rule_key}
                >
                  {ruleTemplate.rule_name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {renderRuleInfo(template)}

        {renderValueInput(currentForm, onChange, template)}

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Notas</span>

          <input
            value={currentForm.notes}
            onChange={(event) =>
              onChange({
                ...currentForm,
                notes: event.target.value,
              })
            }
            placeholder="Opcional. Agregue una aclaración interna sobre esta regla."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />

          <p className="text-xs leading-5 text-slate-400">
            Este campo es opcional. No afecta el cálculo futuro de
            disponibilidad; solo sirve como comentario interno.
          </p>
        </label>
      </div>
    );
  }

  function renderRuleCard(rule: AgendaRule) {
    const isEditingThisRule = editingId === rule.id;
    const template = getTemplate(rule.rule_key);

    return (
      <div
        key={rule.id}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
      >
        {isEditingThisRule ? (
          <div className="space-y-4">
            {renderFormFields({
              currentForm: editingForm,
              onChange: handleEditingFormChange,
              template: editingTemplate,
              showSelector: false,
            })}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleUpdateRule(rule.id)}
                disabled={updatingId === rule.id}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId === rule.id ? "Guardando..." : "Guardar cambios"}
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={updatingId === rule.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {rule.rule_name}
                </p>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {rule.country_code}
                </span>

                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  {scopeLabels[rule.rule_scope]}
                </span>

                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  {valueTypeLabels[rule.value_type]}
                </span>

                {!rule.is_active ? (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    Inactiva
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm font-medium text-slate-700">
                Valor: {formatRuleValue(rule)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Aplica a:{" "}
                {rule.rule_scope === "GLOBAL"
                  ? "General"
                  : rule.applies_to_name || rule.applies_to_key}
              </p>

              {rule.rule_description ? (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {rule.rule_description}
                </p>
              ) : null}

              {!template ? (
                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Esta regla existe en la base de datos, pero no pertenece a la
                  lista guiada actual.
                </p>
              ) : null}

              {rule.notes ? (
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Nota: {rule.notes}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => handleStartEdit(rule)}
                disabled={!template}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => void handleToggleActive(rule)}
                disabled={updatingId === rule.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId === rule.id
                  ? "Procesando..."
                  : rule.is_active
                    ? "Desactivar"
                    : "Activar"}
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteRule(rule.id)}
                disabled={deletingId === rule.id}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === rule.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900">Reglas de agenda</h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Configure reglas flexibles para que CLARIUS pueda interpretar la
          ocupación de la agenda. El sistema no impone tiempos, límites ni
          máximos; el usuario define cada regla según su operación.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <p className="mb-4 text-sm font-semibold text-slate-800">
          Crear regla configurable
        </p>

        {renderFormFields({
          currentForm: form,
          onChange: handleFormChange,
          template: selectedTemplate,
          showSelector: true,
        })}

        <button
          type="button"
          onClick={() => void handleCreateRule()}
          disabled={saving}
          className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Crear regla de agenda"}
        </button>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-slate-800">
          Reglas activas
        </p>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
            Cargando reglas de agenda...
          </div>
        ) : activeRules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
            No hay reglas de agenda configuradas. El usuario debe crear las
            reglas que apliquen a su operación.
          </div>
        ) : (
          <div className="space-y-2">{activeRules.map(renderRuleCard)}</div>
        )}
      </div>

      {inactiveRules.length > 0 ? (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Reglas inactivas
          </p>

          <div className="space-y-2">{inactiveRules.map(renderRuleCard)}</div>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        Estas reglas serán utilizadas más adelante por el motor de
        disponibilidad para decidir si una fecha puede ofrecerse o no. Por ahora
        solo quedan registradas como configuración operativa.
      </div>
    </div>
  );
}
