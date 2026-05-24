"use client";

type OperationalAssignmentManagerProps = {
  countryCode: string;
  countryName: string;
};

const pendingAreas = [
  {
    title: "Técnicos disponibles",
    description:
      "Definir qué técnicos pueden recibir trabajos y en qué condiciones.",
  },
  {
    title: "Capacidad por técnico",
    description:
      "Configurar cuánto puede asumir cada técnico sin imponer valores por defecto.",
  },
  {
    title: "Zonas de trabajo",
    description:
      "Relacionar trabajos, técnicos y clientes según zonas operativas.",
  },
  {
    title: "Tipo de trabajo",
    description:
      "Separar instalaciones, mantenimientos y otros servicios para tratarlos distinto.",
  },
  {
    title: "Carga diaria",
    description:
      "Evaluar cuántos trabajos ya existen en agenda antes de ofrecer nuevos espacios.",
  },
  {
    title: "Disponibilidad para WhatsApp",
    description:
      "Usar la disponibilidad real para ofrecer opciones válidas al cliente.",
  },
];

export default function OperationalAssignmentManager({
  countryCode,
  countryName,
}: OperationalAssignmentManagerProps) {
  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-5">
        <h3 className="text-base font-bold text-slate-900">
          Asignación operativa
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Esta sección preparará la lógica para asignar trabajos según técnicos,
          zonas, tipo de servicio, carga diaria y disponibilidad real de la
          agenda. Por ahora no se aplican reglas automáticas ni valores por
          defecto.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          País operativo: {countryName} ({countryCode})
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          Esta pantalla queda creada como base visual. La asignación real se
          debe conectar después con técnicos, zonas, instalaciones,
          mantenimientos, reglas de agenda y el motor de disponibilidad.
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {pendingAreas.map((area) => (
            <div
              key={area.title}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
            >
              <p className="text-sm font-semibold text-slate-900">
                {area.title}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {area.description}
              </p>

              <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
                Pendiente de definir
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
        Recomendación: después de crear esta base, el siguiente paso debería ser
        diseñar el modelo de técnicos y zonas antes de conectar esta lógica con
        WhatsApp.
      </div>
    </div>
  );
}
