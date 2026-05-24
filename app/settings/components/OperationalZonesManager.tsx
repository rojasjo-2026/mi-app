"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import OperationalZonePlaceAutocomplete from "@/app/settings/components/OperationalZonePlaceAutocomplete";

type OperationalZone = {
  operational_zone_id: string;
  country_code: string;
  name: string;
  description: string | null;
  reference_address: string | null;
  latitude: string | null;
  longitude: string | null;
  radius_km: string | null;
  color_label: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type OperationalZoneApiResponse = {
  success: boolean;
  data?: OperationalZone[] | OperationalZone;
  message?: string;
};

type OperationalZonesManagerProps = {
  countryCode: string;
  countryName: string;
};

type OperationalZoneForm = {
  name: string;
  description: string;
  reference_address: string;
  latitude: string;
  longitude: string;
  radius_km: string;
  color_label: string;
  sort_order: string;
};

const emptyForm: OperationalZoneForm = {
  name: "",
  description: "",
  reference_address: "",
  latitude: "",
  longitude: "",
  radius_km: "",
  color_label: "",
  sort_order: "",
};

function buildPayload(form: OperationalZoneForm, countryCode: string) {
  return {
    country_code: countryCode,
    name: form.name.trim(),
    description: form.description.trim(),
    reference_address: form.reference_address.trim(),
    latitude: form.latitude.trim(),
    longitude: form.longitude.trim(),
    radius_km: form.radius_km.trim(),
    color_label: form.color_label.trim(),
    sort_order: form.sort_order.trim(),
  };
}

function buildFormFromZone(zone: OperationalZone): OperationalZoneForm {
  return {
    name: zone.name,
    description: zone.description || "",
    reference_address: zone.reference_address || "",
    latitude: zone.latitude || "",
    longitude: zone.longitude || "",
    radius_km: zone.radius_km || "",
    color_label: zone.color_label || "",
    sort_order: zone.sort_order !== null ? String(zone.sort_order) : "",
  };
}

function validateForm(form: OperationalZoneForm) {
  if (!form.name.trim()) {
    return "El nombre de la zona es requerido.";
  }

  const hasLatitude = Boolean(form.latitude.trim());
  const hasLongitude = Boolean(form.longitude.trim());

  if (hasLatitude !== hasLongitude) {
    return "Debe ingresar latitud y longitud juntas.";
  }

  if (hasLatitude && hasLongitude) {
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return "La latitud debe estar entre -90 y 90.";
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return "La longitud debe estar entre -180 y 180.";
    }
  }

  if (form.radius_km.trim()) {
    const radius = Number(form.radius_km);

    if (!Number.isFinite(radius) || radius < 0) {
      return "El radio de zona no es válido.";
    }
  }

  if (form.sort_order.trim()) {
    const sortOrder = Number(form.sort_order);

    if (!Number.isFinite(sortOrder) || !Number.isInteger(sortOrder)) {
      return "El orden debe ser un número entero.";
    }
  }

  return "";
}

export default function OperationalZonesManager({
  countryCode,
  countryName,
}: OperationalZonesManagerProps) {
  const [zones, setZones] = useState<OperationalZone[]>([]);
  const [form, setForm] = useState<OperationalZoneForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] =
    useState<OperationalZoneForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeZones = useMemo(
    () => zones.filter((zone) => zone.is_active),
    [zones],
  );

  const inactiveZones = useMemo(
    () => zones.filter((zone) => !zone.is_active),
    [zones],
  );

  function clearMessages() {
    setError("");
    setSuccessMessage("");
  }

  async function loadZones() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/operational-zones?country_code=${encodeURIComponent(
          countryCode,
        )}`,
        { cache: "no-store" },
      );

      const result: OperationalZoneApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar las zonas operativas.",
        );
      }

      setZones(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar las zonas operativas.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateZone() {
    const validationMessage = validateForm(form);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      const response = await fetch("/api/operational-zones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload(form, countryCode)),
      });

      const result: OperationalZoneApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo crear la zona.");
      }

      setForm(emptyForm);
      setSuccessMessage("Zona operativa creada correctamente.");
      await loadZones();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear la zona operativa.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit(zone: OperationalZone) {
    setEditingId(zone.operational_zone_id);
    setEditingForm(buildFormFromZone(zone));
    clearMessages();
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingForm(emptyForm);
    clearMessages();
  }

  async function handleUpdateZone(zoneId: string) {
    const validationMessage = validateForm(editingForm);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setUpdatingId(zoneId);
      clearMessages();

      const response = await fetch("/api/operational-zones", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operational_zone_id: zoneId,
          ...buildPayload(editingForm, countryCode),
        }),
      });

      const result: OperationalZoneApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo actualizar la zona.");
      }

      setEditingId(null);
      setEditingForm(emptyForm);
      setSuccessMessage("Zona operativa actualizada correctamente.");
      await loadZones();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al actualizar la zona operativa.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleZone(zone: OperationalZone) {
    try {
      setUpdatingId(zone.operational_zone_id);
      clearMessages();

      const response = await fetch("/api/operational-zones", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operational_zone_id: zone.operational_zone_id,
          action: zone.is_active ? "deactivate" : "activate",
        }),
      });

      const result: OperationalZoneApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "No se pudo cambiar el estado de la zona.",
        );
      }

      setSuccessMessage(
        zone.is_active
          ? "Zona operativa desactivada correctamente."
          : "Zona operativa activada correctamente.",
      );

      await loadZones();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cambiar el estado de la zona.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    setForm(emptyForm);
    setEditingId(null);
    setEditingForm(emptyForm);
    void loadZones();
  }, [countryCode]);

  function renderFormFields(
    currentForm: OperationalZoneForm,
    onChange: Dispatch<SetStateAction<OperationalZoneForm>>,
  ) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Nombre de la zona
          </span>

          <input
            value={currentForm.name}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="Ej. San Pedro, Ruta Este, Clientes Premium"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />

          <p className="text-xs leading-5 text-slate-400">
            El usuario define sus zonas según su operación. CLARIUS no inventa
            zonas automáticamente.
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Color o etiqueta
          </span>

          <input
            value={currentForm.color_label}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                color_label: event.target.value,
              }))
            }
            placeholder="Opcional. Ej. Azul, Este, Prioridad alta"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />

          <p className="text-xs leading-5 text-slate-400">
            Sirve como referencia visual o clasificación interna.
          </p>
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Descripción
          </span>

          <input
            value={currentForm.description}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Opcional. Describa cómo usa la empresa esta zona."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <div className="space-y-2 lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Dirección de referencia
          </span>

          <OperationalZonePlaceAutocomplete
            value={currentForm.reference_address}
            countryCode={countryCode}
            onValueChange={(value) =>
              onChange((current) => ({
                ...current,
                reference_address: value,
              }))
            }
            onPlaceSelected={(place) =>
              onChange((current) => ({
                ...current,
                reference_address: place.reference_address,
                latitude: place.latitude,
                longitude: place.longitude,
              }))
            }
          />
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Latitud</span>

          <input
            value={currentForm.latitude}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                latitude: event.target.value,
              }))
            }
            placeholder="Se llena automáticamente al seleccionar una dirección."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Longitud</span>

          <input
            value={currentForm.longitude}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                longitude: event.target.value,
              }))
            }
            placeholder="Se llena automáticamente al seleccionar una dirección."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Radio aproximado en km
          </span>

          <input
            value={currentForm.radius_km}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                radius_km: event.target.value,
              }))
            }
            placeholder="Opcional. Ej. 5"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />

          <p className="text-xs leading-5 text-slate-400">
            Puede servir más adelante para sugerir trabajos cercanos a esta
            zona.
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Orden visual
          </span>

          <input
            value={currentForm.sort_order}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                sort_order: event.target.value,
              }))
            }
            placeholder="Opcional. Ej. 1"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />

          <p className="text-xs leading-5 text-slate-400">
            Solo controla cómo se ordenan las zonas en pantalla.
          </p>
        </label>
      </div>
    );
  }

  function renderZoneCard(zone: OperationalZone) {
    const isEditing = editingId === zone.operational_zone_id;
    const hasGps = Boolean(zone.latitude && zone.longitude);

    return (
      <div
        key={zone.operational_zone_id}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
      >
        {isEditing ? (
          <div className="space-y-4">
            {renderFormFields(editingForm, setEditingForm)}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleUpdateZone(zone.operational_zone_id)}
                disabled={updatingId === zone.operational_zone_id}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId === zone.operational_zone_id
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={updatingId === zone.operational_zone_id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">
                  {zone.name}
                </p>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {zone.country_code}
                </span>

                {zone.color_label ? (
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                    {zone.color_label}
                  </span>
                ) : null}

                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                    zone.is_active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-500"
                  }`}
                >
                  {zone.is_active ? "Activa" : "Inactiva"}
                </span>
              </div>

              {zone.description ? (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {zone.description}
                </p>
              ) : null}

              {zone.reference_address ? (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Referencia: {zone.reference_address}
                </p>
              ) : null}

              <p className="mt-2 text-xs leading-5 text-slate-500">
                GPS:{" "}
                {hasGps
                  ? `${zone.latitude}, ${zone.longitude}`
                  : "No configurado"}
              </p>

              {zone.radius_km ? (
                <p className="text-xs leading-5 text-slate-500">
                  Radio aproximado: {zone.radius_km} km
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => handleStartEdit(zone)}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => void handleToggleZone(zone)}
                disabled={updatingId === zone.operational_zone_id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId === zone.operational_zone_id
                  ? "Procesando..."
                  : zone.is_active
                    ? "Desactivar"
                    : "Activar"}
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
        <h3 className="text-base font-bold text-slate-900">Zonas operativas</h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Cree zonas según el criterio de la empresa. CLARIUS no inventa zonas:
          el GPS puede ayudar con sugerencias, cercanía y rutas, pero la zona la
          define el usuario.
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
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          País operativo: {countryName} ({countryCode})
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          Las zonas son configurables por el usuario. Puede crear una zona sin
          GPS y agregar coordenadas después si desea usar sugerencias por
          cercanía o rutas.
        </div>

        <div className="mt-5">
          <p className="mb-4 text-sm font-semibold text-slate-800">
            Crear zona operativa
          </p>

          {renderFormFields(form, setForm)}

          <button
            type="button"
            onClick={() => void handleCreateZone()}
            disabled={saving}
            className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Crear zona operativa"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-slate-800">
          Zonas activas
        </p>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
            Cargando zonas operativas...
          </div>
        ) : activeZones.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
            No hay zonas operativas activas todavía.
          </div>
        ) : (
          <div className="space-y-2">{activeZones.map(renderZoneCard)}</div>
        )}
      </div>

      {inactiveZones.length > 0 ? (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            Zonas inactivas
          </p>

          <div className="space-y-2">{inactiveZones.map(renderZoneCard)}</div>
        </div>
      ) : null}
    </div>
  );
}
