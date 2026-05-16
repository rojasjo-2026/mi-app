"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserFormData = {
  user_id?: string;
  first_name?: string;
  last_name_1?: string;
  last_name_2?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
  is_active?: boolean;
};

type UserFormProps = {
  mode: "create" | "edit";
  initialData?: UserFormData | null;
};

export default function UserForm({ mode, initialData = null }: UserFormProps) {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName1, setLastName1] = useState("");
  const [lastName2, setLastName2] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("TECHNICIAN");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!initialData) return;

    setFirstName(initialData.first_name ?? "");
    setLastName1(initialData.last_name_1 ?? "");
    setLastName2(initialData.last_name_2 ?? "");
    setEmail(initialData.email ?? "");
    setPhone(initialData.phone ?? "");
    setRole(initialData.role ?? "TECHNICIAN");
    setIsActive(initialData.is_active ?? true);
  }, [initialData]);

  function handleBack() {
    if (mode === "edit" && initialData?.user_id) {
      router.push(`/admin/users/${initialData.user_id}`);
      return;
    }

    router.push("/admin/users");
  }

  async function handleSubmit(e: React.FormEvent) {
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
      <div className="mx-auto max-w-5xl space-y-6">
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
                <p className="mt-2 text-sm text-slate-300">
                  Define la información del perfil, rol y estado operativo.
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Rol
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={selectClass}
                  >
                    <option value="TECHNICIAN">Técnico</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMINISTRATION">Administración</option>
                    <option value="ADMIN">Admin</option>
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
