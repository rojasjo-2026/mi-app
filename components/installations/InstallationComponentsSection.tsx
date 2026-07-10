"use client";

import { useEffect, useState } from "react";
import ComponentFormModal from "./ComponentFormModal";

type ComponentItem = {
  component_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  status: string;
  brand: string | null;
  model: string | null;
  technical_notes?: string | null;
};

type Props = {
  installationId: string;
};

export default function InstallationComponentsSection({
  installationId,
}: Props) {
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingComponent, setEditingComponent] =
    useState<ComponentItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchComponents() {
    try {
      const res = await fetch(
        `/api/installations/${installationId}/components`,
        {
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (data.success) {
        setComponents(data.data);
      }
    } catch (error) {
      console.error("Error al obtener componentes:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComponents();
  }, [installationId]);

  function getStatusLabel(status: string) {
    switch (status) {
      case "OPERATIVE":
        return "Operativo";
      case "REVIEW_REQUIRED":
        return "Requiere revisión";
      case "REPLACEMENT_SUGGESTED":
        return "Reemplazo sugerido";
      default:
        return status;
    }
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "OPERATIVE":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "REVIEW_REQUIRED":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "REPLACEMENT_SUGGESTED":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  }

  function handleOpenCreate() {
    setEditingComponent(null);
    setOpen(true);
  }

  function handleOpenEdit(component: ComponentItem) {
    setEditingComponent(component);
    setOpen(true);
  }

  function handleCloseModal() {
    setOpen(false);
    setEditingComponent(null);
  }

  async function handleDelete(componentId: string) {
    const confirmed = window.confirm(
      "¿Está seguro de que desea eliminar este componente?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(componentId);

      const res = await fetch(`/api/components/${componentId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "No se pudo eliminar el componente");
      }

      await fetchComponents();
    } catch (error) {
      console.error("Error al eliminar componente:", error);
      window.alert("No se pudo eliminar el componente");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Cargando componentes...</p>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-500">
            Registro técnico de piezas y equipos instalados.
          </p>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Agregar componente
          </button>
        </div>

        {components.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No hay componentes registrados en esta instalación.
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Componente
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Categoría
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Cantidad
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Unidad
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Estado
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {components.map((component) => (
                    <tr
                      key={component.component_id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {component.name}
                        </div>

                        {component.brand || component.model ? (
                          <div className="mt-1 text-xs leading-5 text-slate-500">
                            {[component.brand, component.model]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        ) : null}

                        {component.technical_notes ? (
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                            {component.technical_notes}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {component.category || "-"}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {component.quantity}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {component.unit || "-"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusClasses(
                            component.status,
                          )}`}
                        >
                          {getStatusLabel(component.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(component)}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(component.component_id)}
                            disabled={deletingId === component.component_id}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === component.component_id
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {open ? (
        <ComponentFormModal
          installationId={installationId}
          component={editingComponent}
          onClose={handleCloseModal}
          onCreated={fetchComponents}
        />
      ) : null}
    </>
  );
}
