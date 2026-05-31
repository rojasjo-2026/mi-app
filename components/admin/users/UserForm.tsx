"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserRole = "TECHNICIAN" | "SUPERVISOR" | "ADMINISTRATION" | "ADMIN";

type UserFormData = {
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

type UserFormProps = {
  mode: "create" | "edit";
  initialData?: UserFormData | null;
};

type PermissionItem = {
  key: string;
  label: string;
  recommendation:
    | "Recomendado"
    | "Opcional"
    | "No recomendado"
    | "Sensible"
    | "Solo admin";
};

type PermissionGroup = {
  key: string;
  title: string;
  description: string;
  items: PermissionItem[];
};

type UserPermissions = Record<string, Record<string, boolean>>;

const STAFF_ROLES: UserRole[] = [
  "TECHNICIAN",
  "SUPERVISOR",
  "ADMINISTRATION",
  "ADMIN",
];

const ROLE_LABELS: Record<UserRole, string> = {
  TECHNICIAN: "Técnico",
  SUPERVISOR: "Supervisor",
  ADMINISTRATION: "Administración",
  ADMIN: "Admin / Dueño",
};

const PERMISSION_GROUPS: PermissionGroup[] = [
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

const ROLE_PERMISSION_OVERRIDES: Record<UserRole, UserPermissions> = {
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

function createEmptyPermissions(): UserPermissions {
  return PERMISSION_GROUPS.reduce<UserPermissions>((acc, group) => {
    acc[group.key] = group.items.reduce<Record<string, boolean>>(
      (itemAcc, item) => {
        itemAcc[item.key] = false;
        return itemAcc;
      },
      {},
    );

    return acc;
  }, {});
}

function clonePermissions(value: UserPermissions): UserPermissions {
  return JSON.parse(JSON.stringify(value)) as UserPermissions;
}

function createRolePermissions(role: UserRole): UserPermissions {
  const permissions = createEmptyPermissions();

  if (role === "ADMIN") {
    PERMISSION_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        permissions[group.key][item.key] = true;
      });
    });

    return permissions;
  }

  const overrides = ROLE_PERMISSION_OVERRIDES[role];

  PERMISSION_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      permissions[group.key][item.key] =
        overrides?.[group.key]?.[item.key] ?? false;
    });
  });

  return permissions;
}

function toUserRole(value?: string | null): UserRole {
  if (STAFF_ROLES.includes(value as UserRole)) {
    return value as UserRole;
  }

  return "TECHNICIAN";
}

function mergePermissions(
  role: UserRole,
  incomingPermissions: unknown,
): UserPermissions {
  const base = createRolePermissions(role);

  if (
    !incomingPermissions ||
    typeof incomingPermissions !== "object" ||
    Array.isArray(incomingPermissions)
  ) {
    return base;
  }

  const incoming = incomingPermissions as Record<
    string,
    Record<string, unknown>
  >;
  const merged = clonePermissions(base);

  PERMISSION_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      const value = incoming[group.key]?.[item.key];

      if (typeof value === "boolean") {
        merged[group.key][item.key] = value;
      }
    });
  });

  return merged;
}

export default function UserForm({ mode, initialData = null }: UserFormProps) {
  const router = useRouter();

  const initialRole = toUserRole(initialData?.role);

  const [firstName, setFirstName] = useState("");
  const [lastName1, setLastName1] = useState("");
  const [lastName2, setLastName2] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions>(() =>
    createRolePermissions(initialRole),
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    finance: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!initialData) return;

    const safeRole = toUserRole(initialData.role);

    setFirstName(initialData.first_name ?? "");
    setLastName1(initialData.last_name_1 ?? "");
    setLastName2(initialData.last_name_2 ?? "");
    setEmail(initialData.email ?? "");
    setPhone(initialData.phone ?? "");
    setRole(safeRole);
    setIsActive(initialData.is_active ?? true);
    setPermissions(mergePermissions(safeRole, initialData.permissions));
  }, [initialData]);

  function handleBack() {
    if (mode === "edit" && initialData?.user_id) {
      router.push(`/admin/users/${initialData.user_id}`);
      return;
    }

    router.push("/admin/users");
  }

  function handleRoleChange(nextRole: UserRole) {
    setRole(nextRole);
    setPermissions(createRolePermissions(nextRole));
    setOpenSections((current) => ({
      ...current,
      finance: true,
    }));
  }

  function toggleSection(sectionKey: string) {
    setOpenSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  }

  function togglePermission(groupKey: string, permissionKey: string) {
    setPermissions((current) => ({
      ...current,
      [groupKey]: {
        ...(current[groupKey] ?? {}),
        [permissionKey]: !(current[groupKey]?.[permissionKey] ?? false),
      },
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const endpoint =
        mode === "create" ? "/api/users" : `/api/users/${initialData?.user_id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const payload = {
        first_name: firstName.trim(),
        last_name_1: lastName1.trim(),
        last_name_2: lastName2.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        role,
        is_active: isActive,
        permissions,
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message ||
            (mode === "create"
              ? "No se pudo crear el usuario"
              : "No se pudo actualizar el usuario"),
        );
      }

      setMessage(
        mode === "create"
          ? "Usuario creado correctamente"
          : "Usuario actualizado correctamente",
      );

      setTimeout(() => {
        if (mode === "create") {
          router.push("/admin/users");
          return;
        }

        if (initialData?.user_id) {
          router.push(`/admin/users/${initialData.user_id}`);
          return;
        }

        router.push("/admin/users");
      }, 700);
    } catch {
      setError(
        mode === "create"
          ? "No se pudo crear el usuario"
          : "No se pudo actualizar el usuario",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  const selectClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 text-white md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                  Personal y accesos
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">
                  {mode === "create" ? "Crear usuario" : "Editar usuario"}
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">
                  Define la información del perfil, el rol base y los permisos
                  que tendrá esta persona dentro de CLARIUS.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
              >
                ← Volver
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 md:px-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Información del perfil
                  </h2>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Nombre
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                    placeholder="Nombre"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Primer apellido
                  </label>
                  <input
                    value={lastName1}
                    onChange={(e) => setLastName1(e.target.value)}
                    className={inputClass}
                    placeholder="Primer apellido"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Segundo apellido
                  </label>
                  <input
                    value={lastName2}
                    onChange={(e) => setLastName2(e.target.value)}
                    className={inputClass}
                    placeholder="Segundo apellido"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Teléfono
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="Teléfono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Correo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Rol y estado
                  </h2>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <p className="text-sm text-slate-500">
                  Al cambiar el rol base se cargan permisos recomendados. Luego
                  puedes ajustarlos manualmente por sección.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Rol base
                  </label>
                  <select
                    value={role}
                    onChange={(e) =>
                      handleRoleChange(e.target.value as UserRole)
                    }
                    className={selectClass}
                  >
                    <option value="TECHNICIAN">Técnico</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMINISTRATION">Administración</option>
                    <option value="ADMIN">Admin / Dueño</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Estado
                  </label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    className={selectClass}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {STAFF_ROLES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleRoleChange(item)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      role === item
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {ROLE_LABELS[item]}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Permisos y accesos
                  </h2>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                <p className="text-sm text-slate-500">
                  Configura el acceso por secciones desplegables. Finanzas se
                  maneja como sección sensible y puede limitarse punto por
                  punto.
                </p>
              </div>

              <div className="space-y-3">
                {PERMISSION_GROUPS.map((group) => {
                  const isOpen = !!openSections[group.key];
                  const enabledCount = group.items.filter(
                    (item) => permissions[group.key]?.[item.key],
                  ).length;

                  return (
                    <div
                      key={group.key}
                      className={`overflow-hidden rounded-2xl border bg-white ${
                        group.key === "finance"
                          ? "border-slate-300"
                          : "border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSection(group.key)}
                        className="flex w-full flex-col gap-3 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {group.title}
                            </h3>

                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                              {enabledCount}/{group.items.length} activos
                            </span>

                            {group.key === "finance" && (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                                Sensible
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-500">
                            {group.description}
                          </p>
                        </div>

                        <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                          {isOpen ? "Ocultar ▲" : "Mostrar ▼"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-t border-slate-200 text-sm">
                            <thead className="bg-slate-100 text-left">
                              <tr>
                                <th className="border-r border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  Permiso
                                </th>
                                <th className="border-r border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  Recomendación
                                </th>
                                <th className="w-44 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  Acceso
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {group.items.map((item) => {
                                const checked =
                                  permissions[group.key]?.[item.key] ?? false;

                                return (
                                  <tr
                                    key={item.key}
                                    className="border-t border-slate-200 transition hover:bg-slate-50"
                                  >
                                    <td className="border-r border-slate-200 px-4 py-3 align-middle">
                                      <div className="font-medium text-slate-800">
                                        {item.label}
                                      </div>
                                    </td>

                                    <td className="border-r border-slate-200 px-4 py-3 align-middle">
                                      <RecommendationBadge
                                        value={item.recommendation}
                                      />
                                    </td>

                                    <td className="px-4 py-3 align-middle">
                                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() =>
                                            togglePermission(
                                              group.key,
                                              item.key,
                                            )
                                          }
                                          className="h-4 w-4 rounded border-slate-300"
                                        />
                                        Permitir
                                      </label>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {message && (
              <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </p>
            )}

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : mode === "create"
                    ? "Crear usuario"
                    : "Guardar cambios"}
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function RecommendationBadge({
  value,
}: {
  value: PermissionItem["recommendation"];
}) {
  const className =
    value === "Recomendado"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : value === "Opcional"
        ? "bg-sky-50 text-sky-700 ring-sky-200"
        : value === "No recomendado"
          ? "bg-slate-50 text-slate-600 ring-slate-200"
          : value === "Sensible"
            ? "bg-amber-50 text-amber-700 ring-amber-200"
            : "bg-red-50 text-red-700 ring-red-200";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}
    >
      {value}
    </span>
  );
}
