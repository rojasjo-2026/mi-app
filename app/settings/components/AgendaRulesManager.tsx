"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  emptyForm,
  ruleTemplates,
  scopeLabels,
  valueTypeLabels,
  type AgendaRule,
  type AgendaRuleForm,
  type AgendaRulesApiResponse,
  type AgendaRulesManagerProps,
  type RuleTemplate,
  type ValueFieldKey,
} from "./agenda-rules/agendaRulesConfig";
import {
  buildEmptyFormFromRule,
  buildPayload,
  formatRuleValue,
  getTemplate,
  toFriendlyError,
  validateForm,
} from "./agenda-rules/agendaRulesUtils";

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

