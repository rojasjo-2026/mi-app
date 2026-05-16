"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import UserForm from "@/components/admin/users/UserForm";

type UserDetail = {
  user_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  email?: string | null;
  phone?: string | null;
  role: string;
  is_active: boolean;
};

export default function EditUserPage() {
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

  return <UserForm mode="edit" initialData={user} />;
}
