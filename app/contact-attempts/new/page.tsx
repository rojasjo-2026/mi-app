"use client";

import { useEffect, useState } from "react";

type FollowUpOption = {
  follow_up_id: string;
  reason?: string | null;
  target_date: string;
  client?: {
    client_id: string;
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
  } | null;
};

type CatalogOption = {
  id: number;
  name: string;
};

type ContactChannelApiItem = {
  contact_channel_id: number;
  name: string;
};

type ContactResultApiItem = {
  contact_result_id: number;
  name: string;
};

function getClientName(client?: FollowUpOption["client"]) {
  const composedName = [
    client?.first_name,
    client?.last_name_1,
    client?.last_name_2,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedName || "Cliente sin nombre";
}

export default function NewContactAttemptPage() {
  const [followUpId, setFollowUpId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [resultId, setResultId] = useState("");
  const [noteText, setNoteText] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextTargetDate, setNextTargetDate] = useState("");

  const [followUpInfo, setFollowUpInfo] = useState<FollowUpOption | null>(null);
  const [channels, setChannels] = useState<CatalogOption[]>([]);
  const [results, setResults] = useState<CatalogOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPageData() {
      try {
        const params = new URLSearchParams(window.location.search);
        const idFromUrl = params.get("follow_up_id") || "";
        setFollowUpId(idFromUrl);

        const [channelsRes, resultsRes] = await Promise.all([
          fetch("/api/contact-channels", { cache: "no-store" }),
          fetch("/api/contact-results", { cache: "no-store" }),
        ]);

        const channelsJson = await channelsRes.json();
        const resultsJson = await resultsRes.json();

        if (!channelsRes.ok || !channelsJson.success) {
          throw new Error("Failed to load contact channels");
        }

        if (!resultsRes.ok || !resultsJson.success) {
          throw new Error("Failed to load contact results");
        }

        setChannels(
          ((channelsJson.data || []) as ContactChannelApiItem[]).map(
            (item) => ({
              id: item.contact_channel_id,
              name: item.name,
            }),
          ),
        );

        setResults(
          ((resultsJson.data || []) as ContactResultApiItem[]).map((item) => ({
            id: item.contact_result_id,
            name: item.name,
          })),
        );

        if (idFromUrl) {
          const followUpRes = await fetch(`/api/follow-ups/${idFromUrl}`, {
            cache: "no-store",
          });

          const followUpJson = await followUpRes.json();

          if (!followUpRes.ok || !followUpJson.success) {
            throw new Error("Failed to load follow up");
          }

          setFollowUpInfo({
            follow_up_id: followUpJson.data.follow_up_id,
            reason: followUpJson.data.reason,
            target_date: followUpJson.data.target_date,
            client: followUpJson.data.client,
          });
        }
      } catch (err) {
        setError("No se pudo cargar la pantalla");
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(
        `/api/follow-ups/${followUpId}/contact-attempts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: followUpInfo?.client?.client_id,
            contact_channel_id: Number(channelId),
            contact_result_id: Number(resultId),
            attempt_datetime: new Date().toISOString(),
            note_text: noteText || null,
            next_action: nextAction || null,
            next_target_date: nextTargetDate || null,
          }),
        },
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to create contact attempt");
      }

      setMessage("Intento creado correctamente");

      setTimeout(() => {
        window.location.href = `/follow-ups/${followUpId}`;
      }, 800);
    } catch (err) {
      setError("No se pudo registrar el intento");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="p-6">Cargando formulario...</main>;
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registrar intento</h1>
          <p className="text-sm text-gray-600">
            Nuevo intento de contacto para seguimiento
          </p>
        </div>

        <button
          onClick={() => window.history.back()}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Volver
        </button>
      </div>

      {followUpInfo && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            Seguimiento relacionado
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Cliente:</span>{" "}
              {getClientName(followUpInfo.client)}
            </p>
            <p>
              <span className="font-medium">Motivo:</span>{" "}
              {followUpInfo.reason || "-"}
            </p>
            <p>
              <span className="font-medium">Fecha objetivo:</span>{" "}
              {new Date(followUpInfo.target_date).toLocaleDateString("es-CR")}
            </p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Formulario</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Canal</label>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccione un canal</option>
              {channels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Resultado</label>
            <select
              value={resultId}
              onChange={(e) => setResultId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccione un resultado</option>
              {results.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Nota</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={4}
              placeholder="Detalle del intento realizado"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Próxima acción
            </label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Ejemplo: volver a llamar"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Próxima fecha
            </label>
            <input
              type="date"
              value={nextTargetDate}
              onChange={(e) => setNextTargetDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          {message && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !followUpId || !followUpInfo?.client?.client_id}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar intento"}
          </button>
        </form>
      </section>
    </main>
  );
}
