export type AgendaRuleScope = "GLOBAL" | "WORK_CATEGORY" | "WORK_TYPE" | "ZONE";

export type AgendaRuleValueType =
  | "NUMBER"
  | "DECIMAL"
  | "BOOLEAN"
  | "TEXT"
  | "SELECT"
  | "JSON";

export type ValueFieldKey = "value_number" | "value_decimal" | "value_text";

export type AgendaRule = {
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

export type AgendaRulesApiResponse = {
  success: boolean;
  data?: AgendaRule[] | AgendaRule | { id: string };
  message?: string;
};

export type AgendaRuleForm = {
  value_number: string;
  value_decimal: string;
  value_text: string;
  value_boolean: "" | "true" | "false";
  value_json: string;
  notes: string;
};

export type AgendaRulesManagerProps = {
  countryCode: string;
  countryName: string;
};

export type RuleTemplate = {
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

export const emptyForm: AgendaRuleForm = {
  value_number: "",
  value_decimal: "",
  value_text: "",
  value_boolean: "",
  value_json: "",
  notes: "",
};

export const ruleTemplates: RuleTemplate[] = [
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

export const scopeLabels: Record<AgendaRuleScope, string> = {
  GLOBAL: "Global",
  WORK_CATEGORY: "Categoría de trabajo",
  WORK_TYPE: "Tipo de trabajo",
  ZONE: "Zona",
};

export const valueTypeLabels: Record<AgendaRuleValueType, string> = {
  NUMBER: "Número entero",
  DECIMAL: "Número decimal",
  BOOLEAN: "Sí / No",
  TEXT: "Texto",
  SELECT: "Selección",
  JSON: "Configuración avanzada",
};

export const unitLabels: Record<string, string> = {
  JOBS: "trabajos",
  MINUTES: "minutos",
  DAYS: "días",
};

