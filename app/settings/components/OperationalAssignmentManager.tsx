"use client";

type OperationalAssignmentManagerProps = {
  countryCode: string;
  countryName: string;
};

const pendingAreas = [
  {
    title: "Técnicos disponibles",
    description:
      "Definir qué técnicos pueden recibir trabajos según su estado, rol y disponibilidad operativa.",
  },
  {
    title: "Capacidad por técnico",
    description:
      "Configurar cuánto puede asumir cada técnico sin que CLARIUS imponga tiempos o cantidades por defecto.",
  },
  {
    title: "Zonas de trabajo",
    description:
      "Las zonas las define el usuario según su operación. CLARIUS puede usar GPS para sugerir cercanía, rutas o posibles agrupaciones.",
  },
  {
    title: "Tipo de trabajo",
    description:
      "Separar instalaciones, mantenimientos y otros servicios porque no consumen la misma capacidad ni el mismo tiempo.",
  },
  {
    title: "Carga diaria",
    description:
      "Evaluar trabajos existentes en agenda, instalaciones programadas, mantenimientos, bloqueos y reglas configuradas.",
  },
  {
    title: "Disponibilidad para WhatsApp",
    description:
      "Usar la disponibilidad real para ofrecer al cliente solo opciones válidas por WhatsApp.",
  },
];

const locationLogic = [
  {
    title: "GPS / geolocalización",
    description:
      "Se usa para cálculos reales: distancia, cercanía, rutas y futuras sugerencias de zona.",
    badge: "Primera fuente para cálculo",
  },
  {
    title: "Zona definida por el usuario",
    description:
      "Se usa como clasificación operativa. CLARIUS no inventa zonas; la empresa decide cómo organizar su operación.",
    badge: "Criterio del negocio",
  },
  {
    title: "Dirección manual",
    description:
      "Provincia, cantón, distrito, dirección y punto de referencia sirven como respaldo visual cuando no hay GPS o zona asignada.",
    badge: "Respaldo",
  },
];

const futureFlow = [
  "El usuario crea o asigna zonas según su criterio.",
  "La instalación o mantenimiento guarda dirección y, si existe, latitud y longitud.",
  "CLARIUS usa GPS para calcular cercanía, distancia y rutas.",
  "Las reglas de agenda revisan capacidad, bloqueos, horarios y tipo de trabajo.",
  "WhatsApp solo ofrece fechas y horarios válidos según la disponibilidad real.",
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
          Esta sección prepara la lógica para asignar trabajos según técnicos,
          ubicación, tipo de servicio, carga diaria y disponibilidad real de la
          agenda. CLARIUS no impone zonas, tiempos ni capacidades por defecto.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          País operativo: {countryName} ({countryCode})
        </div>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          Esta pantalla queda como base visual. La asignación real se conectará
          después con técnicos, instalaciones, mantenimientos, reglas de agenda,
          ubicación GPS y el motor de disponibilidad.
        </div>

        <div className="mt-5">
          <h4 className="text-sm font-bold text-slate-900">
            Lógica de localización operativa
          </h4>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            La ubicación no debe depender de zonas inventadas por el sistema. La
            geolocalización ayuda a calcular y sugerir; la zona la define el
            usuario según su operación.
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {locationLogic.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {item.description}
                </p>

                <span className="mt-3 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-bold text-slate-900">
            Áreas pendientes de configuración
          </h4>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
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

        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
          <h4 className="text-sm font-bold text-blue-900">
            Flujo esperado para disponibilidad
          </h4>

          <div className="mt-3 space-y-2">
            {futureFlow.map((step, index) => (
              <div key={step} className="flex gap-3 text-xs leading-5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  {index + 1}
                </span>

                <p className="text-blue-900">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
        Siguiente paso recomendado: definir cómo CLARIUS identificará técnicos
        disponibles y capacidad operativa sin crear zonas automáticas. Las zonas
        deben ser criterio del usuario; GPS solo debe apoyar sugerencias,
        cercanía y rutas.
      </div>
    </div>
  );
}
