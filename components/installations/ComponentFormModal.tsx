"use client";

import { useEffect, useState } from "react";

type EditableComponent = {
  component_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  status: string;
  brand: string | null;
  model: string | null;
  technical_notes?: string | null;
} | null;

type Props = {
  installationId: string;
  component?: EditableComponent;
  onClose: () => void;
  onCreated: () => void;
};

export default function ComponentFormModal({
  installationId,
  component = null,
  onClose,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    quantity: 1,
    unit: "",
    category: "",
    brand: "",
    model: "",
    status: "OPERATIVE",
    technical_notes: "",
  });

  useEffect(() => {
    if (component) {
      setForm({
        name: component.name || "",
        quantity: Number(component.quantity) || 1,
        unit: component.unit || "",
        category: component.category || "",
        brand: component.brand || "",
        model: component.model || "",
        status: component.status || "OPERATIVE",
        technical_notes: component.technical_notes || "",
      });
    } else {
      setForm({
        name: "",
        quantity: 1,
        unit: "",
        category: "",
        brand: "",
        model: "",
        status: "OPERATIVE",
        technical_notes: "",
      });
    }
  }, [component]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const isEditing = Boolean(component?.component_id);
      const url = isEditing
        ? `/api/components/${component?.component_id}`
        : `/api/installations/${installationId}/components`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        window.alert(
          isEditing
            ? "Error al actualizar componente"
            : "Error al crear componente",
        );
        return;
      }

      onCreated();
      onClose();
    } catch (error) {
      console.error("Error saving component:", error);
      window.alert("Ocurrió un error guardando el componente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl md:p-7">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {component ? "Editar componente" : "Agregar componente"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Completa la información técnica del componente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Nombre del componente"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
            required
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              name="quantity"
              type="number"
              min="1"
              value={form.quantity}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
              placeholder="Cantidad"
            />

            <input
              name="unit"
              placeholder="Unidad (pieza, metros, etc.)"
              value={form.unit}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
            />
          </div>

          <input
            name="category"
            placeholder="Categoría"
            value={form.category}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              name="brand"
              placeholder="Marca"
              value={form.brand}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
            />

            <input
              name="model"
              placeholder="Modelo"
              value={form.model}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
            />
          </div>

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
          >
            <option value="OPERATIVE">Operativo</option>
            <option value="REVIEW_REQUIRED">Requiere revisión</option>
            <option value="REPLACEMENT_SUGGESTED">Reemplazo sugerido</option>
          </select>

          <textarea
            name="technical_notes"
            placeholder="Notas técnicas"
            value={form.technical_notes}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? component
                  ? "Guardando..."
                  : "Creando..."
                : component
                  ? "Guardar cambios"
                  : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
