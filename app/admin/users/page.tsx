"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type UserItem = {
  user_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
  is_active: boolean;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const query = search.trim()
        ? `/api/users?search=${encodeURIComponent(search.trim())}`
        : "/api/users";

      const res = await fetch(query, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudo cargar el personal");
      }

      setUsers(Array.isArray(result.data) ? result.data : []);
    } catch {
      setUsers([]);
      setError("No se pudo cargar el personal y accesos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user) => {
      const fullName = [
        user.first_name,
        user.last_name_1,
        user.last_name_2 ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        fullName.includes(term) ||
        (user.email ?? "").toLowerCase().includes(term) ||
        (user.phone ?? "").toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 xl:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 text-white md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
                  Administración
                </div>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">
                  Personal y accesos
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300 md:text-base">
                  Gestiona el personal del sistema, sus roles y el acceso
                  operativo dentro de la aplicación.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadUsers}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Actualizar
                </button>

                <Link
                  href="/admin/users/new"
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  + Crear usuario
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-5 md:px-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <MetricCard label="Total" value={String(users.length)} />
              <MetricCard
                label="Activos"
                value={String(users.filter((user) => user.is_active).length)}
              />
              <MetricCard
                label="Técnicos"
                value={String(
                  users.filter((user) => user.role === "TECHNICIAN").length,
                )}
              />
              <MetricCard
                label="Supervisores"
                value={String(
                  users.filter((user) => user.role === "SUPERVISOR").length,
                )}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="w-full max-w-xl">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Buscar personal
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, correo, teléfono o rol"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="text-sm text-slate-500">
              Mostrando {filteredUsers.length} registro
              {filteredUsers.length === 1 ? "" : "s"}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            {loading ? (
              <div className="bg-white px-5 py-8 text-sm text-slate-500">
                Cargando personal...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="bg-white px-5 py-8 text-sm text-slate-500">
                No hay personal registrado.
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Nombre
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Contacto
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Rol
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Estado
                      </th>
                      <th className="px-4 py-3 font-semibold text-slate-600">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.user_id}
                        className="border-b border-slate-200 last:border-b-0"
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-slate-800">
                            {formatFullName(user)}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="space-y-1">
                            <div className="text-slate-700">
                              {user.email || "-"}
                            </div>
                            <div className="text-slate-500">
                              {user.phone || "-"}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <RoleBadge role={user.role} />
                        </td>

                        <td className="px-4 py-4 align-top">
                          <StatusBadge isActive={user.is_active} />
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/admin/users/${user.user_id}`}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Ver
                            </Link>
                            <Link
                              href={`/admin/users/${user.user_id}/edit`}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Editar
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {formatRole(role)}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}

function formatFullName(user: UserItem) {
  return [user.first_name, user.last_name_1, user.last_name_2]
    .filter(Boolean)
    .join(" ");
}

function formatRole(role?: string | null) {
  if (!role) return "-";
  if (role === "TECHNICIAN") return "Técnico";
  if (role === "SUPERVISOR") return "Supervisor";
  if (role === "ADMINISTRATION") return "Administración";
  if (role === "ADMIN") return "Admin";
  return role;
}
