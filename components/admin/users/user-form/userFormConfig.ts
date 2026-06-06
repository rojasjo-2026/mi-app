export type UserRole = "TECHNICIAN" | "SUPERVISOR" | "ADMINISTRATION" | "ADMIN";

export type UserFormData = {
  user_id?: string;
  first_name?: string;
  last_name_1?: string;
  last_name_2?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  is_active?: boolean;
  permissions?: unknown;
};

export type UserFormProps = {
  mode: "create" | "edit";
  initialData?: UserFormData | null;
};

export type PermissionItem = {
  key: string;
  label: string;
  recommendation:
    | "Recomendado"
    | "Opcional"
    | "No recomendado"
    | "Sensible"
    | "Solo admin";
};

export type PermissionGroup = {
  key: string;
  title: string;
  description: string;
  items: PermissionItem[];
};

export type UserPermissions = Record<string, Record<string, boolean>>;

export const STAFF_ROLES: UserRole[] = [
  "TECHNICIAN",
  "SUPERVISOR",
  "ADMINISTRATION",
  "ADMIN",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  TECHNICIAN: "Técnico",
  SUPERVISOR: "Supervisor",
  ADMINISTRATION: "Administración",
  ADMIN: "Admin / Dueño",
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "general",
    title: "Información general",
    description: "Controla el acceso básico al sistema y datos generales.",
    items: [
      {
        key: "viewDashboard",
        label: "Ver dashboard principal",
        recommendation: "Recomendado",
      },
      {
        key: "viewOwnProfile",
        label: "Ver su propio perfil",
        recommendation: "Recomendado",
      },
      {
        key: "viewUserDirectory",
        label: "Ver listado de personal",
        recommendation: "Opcional",
      },
    ],
  },
  {
    key: "commercial",
    title: "Información comercial",
    description: "Permisos relacionados con datos comerciales del cliente.",
    items: [
      {
        key: "viewCommercialInfo",
        label: "Ver información comercial",
        recommendation: "Opcional",
      },
      {
        key: "editCommercialInfo",
        label: "Editar información comercial",
        recommendation: "Sensible",
      },
      {
        key: "viewCreditTerms",
        label: "Ver condiciones de crédito",
        recommendation: "Sensible",
      },
      {
        key: "editCreditTerms",
        label: "Editar condiciones de crédito",
        recommendation: "Solo admin",
      },
    ],
  },
  {
    key: "clientInstallation",
    title: "Cliente e instalación",
    description: "Controla el acceso a clientes, instalaciones y trabajos.",
    items: [
      {
        key: "viewClients",
        label: "Ver clientes",
        recommendation: "Recomendado",
      },
      {
        key: "createClients",
        label: "Crear clientes",
        recommendation: "Opcional",
      },
      {
        key: "editClients",
        label: "Editar clientes",
        recommendation: "Sensible",
      },
      {
        key: "viewInstallations",
        label: "Ver instalaciones",
        recommendation: "Recomendado",
      },
      {
        key: "createInstallations",
        label: "Crear instalaciones",
        recommendation: "Opcional",
      },
      {
        key: "editInstallations",
        label: "Editar instalaciones",
        recommendation: "Sensible",
      },
    ],
  },
  {
    key: "actions",
    title: "Acciones",
    description: "Permisos para ejecutar acciones operativas sobre trabajos.",
    items: [
      {
        key: "scheduleWork",
        label: "Programar trabajos",
        recommendation: "Opcional",
      },
      {
        key: "completeWork",
        label: "Completar mantenimientos",
        recommendation: "Recomendado",
      },
      {
        key: "reassignWork",
        label: "Reasignar trabajos",
        recommendation: "Sensible",
      },
      {
        key: "cancelWork",
        label: "Cancelar trabajos",
        recommendation: "Solo admin",
      },
    ],
  },
  {
    key: "notes",
    title: "Notas",
    description: "Permisos para consultar y administrar notas internas.",
    items: [
      {
        key: "viewNotes",
        label: "Ver notas",
        recommendation: "Recomendado",
      },
      {
        key: "createNotes",
        label: "Crear notas",
        recommendation: "Recomendado",
      },
      {
        key: "editNotes",
        label: "Editar notas",
        recommendation: "Opcional",
      },
      {
        key: "deleteNotes",
        label: "Eliminar notas",
        recommendation: "Sensible",
      },
    ],
  },
  {
    key: "files",
    title: "Archivos",
    description: "Permisos para ver, subir o eliminar archivos.",
    items: [
      {
        key: "viewFiles",
        label: "Ver archivos",
        recommendation: "Recomendado",
      },
      {
        key: "uploadFiles",
        label: "Subir archivos",
        recommendation: "Recomendado",
      },
      {
        key: "deleteFiles",
        label: "Eliminar archivos",
        recommendation: "Sensible",
      },
    ],
  },
  {
    key: "contactManagement",
    title: "Gestión de contacto",
    description: "Permisos relacionados con mensajes, contacto y WhatsApp.",
    items: [
      {
        key: "viewContactFlows",
        label: "Ver gestión de contacto",
        recommendation: "Recomendado",
      },
      {
        key: "sendMessages",
        label: "Enviar mensajes",
        recommendation: "Opcional",
      },
      {
        key: "runAutomation",
        label: "Ejecutar automatizaciones",
        recommendation: "Sensible",
      },
      {
        key: "closeContactFlows",
        label: "Cerrar flujos de contacto",
        recommendation: "Opcional",
      },
    ],
  },
  {
    key: "maintenanceHistory",
    title: "Historial del mantenimiento",
    description: "Controla qué historial puede consultar el usuario.",
    items: [
      {
        key: "viewMaintenanceHistory",
        label: "Ver historial de mantenimiento",
        recommendation: "Recomendado",
      },
      {
        key: "viewClientActivityLog",
        label: "Ver historial general del cliente",
        recommendation: "Opcional",
      },
      {
        key: "viewSensitiveHistory",
        label: "Ver historial sensible",
        recommendation: "Sensible",
      },
    ],
  },
  {
    key: "finance",
    title: "Finanzas",
    description: "Controla el acceso a montos, facturas, pagos y reportes.",
    items: [
      {
        key: "viewWorkAmounts",
        label: "Ver montos del trabajo",
        recommendation: "Sensible",
      },
      {
        key: "viewInvoices",
        label: "Ver facturas",
        recommendation: "Sensible",
      },
      {
        key: "createInvoices",
        label: "Crear facturas",
        recommendation: "Sensible",
      },
      {
        key: "registerPayments",
        label: "Registrar pagos",
        recommendation: "Sensible",
      },
      {
        key: "editAmounts",
        label: "Editar montos",
        recommendation: "Solo admin",
      },
      {
        key: "cancelInvoices",
        label: "Cancelar facturas",
        recommendation: "Solo admin",
      },
      {
        key: "reversePayments",
        label: "Revertir pagos",
        recommendation: "Solo admin",
      },
      {
        key: "viewInternalCosts",
        label: "Ver costos internos",
        recommendation: "Solo admin",
      },
      {
        key: "viewIncomeReports",
        label: "Ver reportes de ingresos",
        recommendation: "Sensible",
      },
      {
        key: "exportReports",
        label: "Exportar reportes",
        recommendation: "Sensible",
      },
    ],
  },
];

export const ROLE_PERMISSION_OVERRIDES: Record<UserRole, UserPermissions> = {
  TECHNICIAN: {
    general: {
      viewDashboard: true,
      viewOwnProfile: true,
      viewUserDirectory: false,
    },
    commercial: {
      viewCommercialInfo: false,
      editCommercialInfo: false,
      viewCreditTerms: false,
      editCreditTerms: false,
    },
    clientInstallation: {
      viewClients: true,
      createClients: false,
      editClients: false,
      viewInstallations: true,
      createInstallations: false,
      editInstallations: false,
    },
    actions: {
      scheduleWork: false,
      completeWork: true,
      reassignWork: false,
      cancelWork: false,
    },
    notes: {
      viewNotes: true,
      createNotes: true,
      editNotes: false,
      deleteNotes: false,
    },
    files: {
      viewFiles: true,
      uploadFiles: true,
      deleteFiles: false,
    },
    contactManagement: {
      viewContactFlows: true,
      sendMessages: false,
      runAutomation: false,
      closeContactFlows: false,
    },
    maintenanceHistory: {
      viewMaintenanceHistory: true,
      viewClientActivityLog: false,
      viewSensitiveHistory: false,
    },
    finance: {
      viewWorkAmounts: false,
      viewInvoices: false,
      createInvoices: false,
      registerPayments: false,
      editAmounts: false,
      cancelInvoices: false,
      reversePayments: false,
      viewInternalCosts: false,
      viewIncomeReports: false,
      exportReports: false,
    },
  },
  SUPERVISOR: {
    general: {
      viewDashboard: true,
      viewOwnProfile: true,
      viewUserDirectory: true,
    },
    commercial: {
      viewCommercialInfo: true,
      editCommercialInfo: false,
      viewCreditTerms: false,
      editCreditTerms: false,
    },
    clientInstallation: {
      viewClients: true,
      createClients: true,
      editClients: true,
      viewInstallations: true,
      createInstallations: true,
      editInstallations: true,
    },
    actions: {
      scheduleWork: true,
      completeWork: true,
      reassignWork: true,
      cancelWork: false,
    },
    notes: {
      viewNotes: true,
      createNotes: true,
      editNotes: true,
      deleteNotes: false,
    },
    files: {
      viewFiles: true,
      uploadFiles: true,
      deleteFiles: false,
    },
    contactManagement: {
      viewContactFlows: true,
      sendMessages: true,
      runAutomation: false,
      closeContactFlows: true,
    },
    maintenanceHistory: {
      viewMaintenanceHistory: true,
      viewClientActivityLog: true,
      viewSensitiveHistory: false,
    },
    finance: {
      viewWorkAmounts: true,
      viewInvoices: true,
      createInvoices: false,
      registerPayments: false,
      editAmounts: false,
      cancelInvoices: false,
      reversePayments: false,
      viewInternalCosts: false,
      viewIncomeReports: false,
      exportReports: false,
    },
  },
  ADMINISTRATION: {
    general: {
      viewDashboard: true,
      viewOwnProfile: true,
      viewUserDirectory: true,
    },
    commercial: {
      viewCommercialInfo: true,
      editCommercialInfo: true,
      viewCreditTerms: true,
      editCreditTerms: false,
    },
    clientInstallation: {
      viewClients: true,
      createClients: true,
      editClients: true,
      viewInstallations: true,
      createInstallations: true,
      editInstallations: true,
    },
    actions: {
      scheduleWork: true,
      completeWork: true,
      reassignWork: true,
      cancelWork: false,
    },
    notes: {
      viewNotes: true,
      createNotes: true,
      editNotes: true,
      deleteNotes: false,
    },
    files: {
      viewFiles: true,
      uploadFiles: true,
      deleteFiles: false,
    },
    contactManagement: {
      viewContactFlows: true,
      sendMessages: true,
      runAutomation: true,
      closeContactFlows: true,
    },
    maintenanceHistory: {
      viewMaintenanceHistory: true,
      viewClientActivityLog: true,
      viewSensitiveHistory: true,
    },
    finance: {
      viewWorkAmounts: true,
      viewInvoices: true,
      createInvoices: true,
      registerPayments: true,
      editAmounts: true,
      cancelInvoices: false,
      reversePayments: false,
      viewInternalCosts: false,
      viewIncomeReports: true,
      exportReports: true,
    },
  },
  ADMIN: {},
};

