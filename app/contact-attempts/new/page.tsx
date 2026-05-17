"use client";

import { useEffect, useMemo, useState } from "react";

type FollowUpOption = {
  follow_up_id: string;
  reason?: string | null;
  target_date: string;
  client?: {
    client_id: string;
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
    phone_primary?: string | null;
    email?: string | null;
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

function formatDateLabel(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getOptionName(options: CatalogOption[], selectedId: string) {
  const parsedId = Number(selectedId);

  if (!selectedId || Number.isNaN(parsedId)) return "-";

  return options.find((item) => item.id === parsedId)?.name || "-";
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
        const idFromUrl =
          params.get("follow_up_id") || params.get("followUpId") || "";

        setFollowUpId(idFromUrl);

        if (!idFromUrl) {
          setError("No se recibió un mantenimiento para registrar el intento.");
          return;
        }

        const [channelsRes, resultsRes, followUpRes] = await Promise.all([
          fetch("/api/contact-channels", { cache: "no-store" }),
          fetch("/api/contact-attempts/contact-results", {
            cache: "no-store",
          }),
          fetch(`/api/follow-ups/${idFromUrl}`, {
            cache: "no-store",
          }),
        ]);

        const channelsJson = await channelsRes.json();
        const resultsJson = await resultsRes.json();
        const followUpJson = await followUpRes.json();

        if (!channelsRes.ok || !channelsJson.success) {
          throw new Error("No se pudieron cargar los canales de contacto");
        }

        if (!resultsRes.ok || !resultsJson.success) {
          throw new Error("No se pudieron cargar los resultados de contacto");
        }

        if (!followUpRes.ok || !followUpJson.success) {
          throw new Error("No se pudo cargar el mantenimiento relacionado");
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

        setFollowUpInfo({
          follow_up_id: followUpJson.data.follow_up_id,
          reason: followUpJson.data.reason,
          target_date: followUpJson.data.target_date,
          client: followUpJson.data.client,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo cargar la pantalla",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, []);

  const selectedChannelName = useMemo(() => {
    return getOptionName(channels, channelId);
  }, [channels, channelId]);

  const selectedResultName = useMemo(() => {
    return getOptionName(results, resultId);
  }, [results, resultId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    if (!followUpId) {
      setError("No se encontró el mantenimiento relacionado.");
      setSaving(false);
      return;
    }

    if (!followUpInfo?.client?.client_id) {
      setError("El mantenimiento no tiene un cliente asociado.");
      setSaving(false);
      return;
    }

    if (!channelId) {
      setError("Debes seleccionar un canal de contacto.");
      setSaving(false);
      return;
    }

    if (!resultId) {
      setError("Debes seleccionar un resultado de contacto.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/follow-ups/${followUpId}/contact-attempts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: followUpInfo.client.client_id,
            contact_channel_id: Number(channelId),
            contact_result_id: Number(resultId),
            attempt_datetime: new Date().toISOString(),
            note_text: noteText.trim() || null,
            next_action: nextAction.trim() || null,
            next_target_date: nextTargetDate || null,
          }),
        },
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudo registrar el intento");
      }

      setMessage("Intento creado correctamente");

      setTimeout(() => {
        window.location.href = `/follow-ups/${followUpId}`;
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar el intento",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-slate-600">
              Cargando formulario...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Gestión de contacto
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Registrar intento
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Registra una llamada, mensaje o seguimiento realizado para este
                mantenimiento.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Volver
          </button>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Intento de contacto
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Selecciona el canal usado, el resultado obtenido y cualquier
                    detalle relevante.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Canal
                    </label>
                    <select
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
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
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Resultado
                    </label>
                    <select
                      value={resultId}
                      onChange={(e) => setResultId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
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
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nota
                  </label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                    rows={5}
                    placeholder="Detalle del intento realizado, respuesta del cliente o información importante."
                  />
                </div>
              </section>

              <section className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Próximo seguimiento
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Estos campos son opcionales y ayudan a preparar la siguiente
                    acción.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Próxima acción
                    </label>
                    <input
                      type="text"
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                      placeholder="Ejemplo: volver a llamar"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Próxima fecha
                    </label>
                    <input
                      type="date"
                      value={nextTargetDate}
                      onChange={(e) => setNextTargetDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                    />
                  </div>
                </div>
              </section>

              {message ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={
                    saving || !followUpId || !followUpInfo?.client?.client_id
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar intento"}
                </button>

                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Mantenimiento relacionado
              </p>

              {followUpInfo ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {getClientName(followUpInfo.client)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {followUpInfo.reason || "Mantenimiento programado"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Fecha objetivo
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatDateLabel(followUpInfo.target_date)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Teléfono
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {followUpInfo.client?.phone_primary || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Correo
                    </p>
                    <p className="mt-2 break-all text-sm font-medium text-slate-800">
                      {followUpInfo.client?.email || "-"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  No se encontró información del mantenimiento relacionado.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Resumen del intento
              </p>

              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Canal
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {selectedChannelName}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Resultado
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {selectedResultName}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Próxima fecha
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {formatDateLabel(nextTargetDate)}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
