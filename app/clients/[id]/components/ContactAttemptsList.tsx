async function getContactAttempts(followUpId: string) {
  const res = await fetch(
    `http://localhost:3000/api/follow-ups/${followUpId}/contact-attempts`,
    {
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error loading contact attempts: ${res.status} - ${text}`);
  }

  return res.json();
}

type Props = {
  followUpId: string;
};

export default async function ContactAttemptsList({ followUpId }: Props) {
  const result = await getContactAttempts(followUpId);
  const attempts = result.data || [];

  if (attempts.length === 0) {
    return (
      <p className="mt-3 text-sm text-gray-600">No hay intentos registrados</p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {attempts.map((attempt: any) => (
        <div
          key={attempt.contact_attempt_id}
          className="bg-white border rounded-xl p-4 shadow-sm"
        >
          <p>
            <strong>Fecha:</strong>{" "}
            {attempt.attempt_datetime
              ? new Date(attempt.attempt_datetime).toLocaleString()
              : "-"}
          </p>

          <p>
            <strong>Canal:</strong>{" "}
            {attempt.contact_channel?.name ||
              attempt.contact_channel?.code ||
              "-"}
          </p>

          <p>
            <strong>Resultado:</strong>{" "}
            {attempt.contact_result?.name ||
              attempt.contact_result?.code ||
              "-"}
          </p>

          <p>
            <strong>Nota:</strong> {attempt.note_text || "-"}
          </p>

          <p>
            <strong>Próxima acción:</strong> {attempt.next_action || "-"}
          </p>

          <p>
            <strong>Próxima fecha:</strong>{" "}
            {attempt.next_target_date
              ? new Date(attempt.next_target_date).toLocaleDateString()
              : "-"}
          </p>
        </div>
      ))}
    </div>
  );
}
