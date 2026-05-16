"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type UserDetail = {
  user_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export default function UserDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      if (!id) {
        setError("Usuario no encontrado");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/users/${id}`, {
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.message || "No se pudo cargar el usuario");
        }

        setUser(result.data);
      } catch {
        setError("No se pudo cargar el usuario");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [id]);

  if (loading) {
    return <main className="p-6">Cargando usuario...</main>;
  }

  if (error || !user) {
    return <main className="p-6">{error || "Usuario no encontrado"}</main>;
  }

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
                  {formatFullName(user)}
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Vista general del perfil, rol y estado del usuario.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/admin/users/${user.user_id}/edit`}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Editar
                </Link>
                <Link
                  href="/admin/users"
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Volver
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 bg-slate-50 px-6 py-5 md:grid-cols-4 md:px-8">
            <MetricCard label="Rol" value={formatRole(user.role)} />
            <MetricCard
              label="Estado"
              value={user.is_active ? "Activo" : "Inactivo"}
            />
            <MetricCard
              label="Creado"
              value={formatDateTime(user.created_at)}
            />
            <MetricCard
              label="Actualizado"
              value={formatDateTime(user.updated_at)}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card title="Información personal">
            <InfoRow label="Nombre" value={user.first_name} />
            <InfoRow label="Primer apellido" value={user.last_name_1} />
            <InfoRow label="Segundo apellido" value={user.last_name_2 || "-"} />
          </Card>

          <Card title="Contacto y acceso">
            <InfoRow label="Correo" value={user.email || "-"} />
            <InfoRow label="Teléfono" value={user.phone || "-"} />
            <InfoRow label="Rol" value={formatRole(user.role)} />
            <InfoRow
              label="Estado"
              value={user.is_active ? "Activo" : "Inactivo"}
            />
          </Card>
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="space-y-3">{children}</div>
    </section>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-800">{value}</p>
    </div>
  );
}

function formatFullName(user: UserDetail) {
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

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-CR");
}
