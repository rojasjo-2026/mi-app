"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  followUpId: string;
  clientId: string;
};

export default function NewContactAttemptForm({ followUpId, clientId }: Props) {
  const router = useRouter();

  const [noteText, setNoteText] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextTargetDate, setNextTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const body = {
      client_id: clientId,
      contact_channel_id: 1,
      contact_result_id: 1,
      attempt_datetime: new Date().toISOString(),
      note_text: noteText || null,
      next_action: nextAction || null,
      next_target_date: nextTargetDate
        ? new Date(nextTargetDate).toISOString()
        : null,
    };

    try {
      const res = await fetch(
        `/api/follow-ups/${followUpId}/contact-attempts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Error al crear intento");
      }

      setMessage("Intento creado");
      setNoteText("");
      setNextAction("");
      setNextTargetDate("");

      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Error al crear intento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border rounded-xl p-4 mt-3 space-y-2">
      <h4 className="font-semibold">Registrar intento de contacto</h4>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          placeholder="Nota"
          className="w-full border p-2 rounded"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />

        <input
          type="text"
          placeholder="Próxima acción"
          className="w-full border p-2 rounded"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
        />

        <input
          type="date"
          className="w-full border p-2 rounded"
          value={nextTargetDate}
          onChange={(e) => setNextTargetDate(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? "Guardando..." : "Guardar intento"}
        </button>
      </form>

      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}
