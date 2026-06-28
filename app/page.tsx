import { getOrCreateAppSettingsService } from "@/lib/services/settingsService";
import { getBusinessCountryMeta } from "@/lib/settings/appSettingsUtils";

export const dynamic = "force-dynamic";

type HomeSettings = {
  locale: string;
  timeZone?: string;
};

type CountryMeta = {
  locale?: string | null;
  timeZone?: string | null;
  timezone?: string | null;
  countryPreset?: {
    timezones?: Array<{
      value?: string | null;
    }> | null;
  } | null;
};

async function getHomeSettings(): Promise<HomeSettings> {
  try {
    const settings = await getOrCreateAppSettingsService();
    const businessCountryMeta = getBusinessCountryMeta(
      settings as never,
    ) as CountryMeta;

    const locale = businessCountryMeta.locale || "es";

    const timeZone =
      businessCountryMeta.timeZone ||
      businessCountryMeta.timezone ||
      businessCountryMeta.countryPreset?.timezones?.[0]?.value ||
      undefined;

    return {
      locale,
      timeZone: timeZone || undefined,
    };
  } catch {
    return {
      locale: "es",
    };
  }
}

function formatCapitalizedDate(
  options: Intl.DateTimeFormatOptions,
  locale: string,
  timeZone?: string,
) {
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    ...options,
    ...(timeZone ? { timeZone } : {}),
  };

  try {
    const formattedDate = new Intl.DateTimeFormat(
      locale || "es",
      dateFormatOptions,
    ).format(new Date());

    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  } catch {
    const formattedDate = new Intl.DateTimeFormat("es", options).format(
      new Date(),
    );

    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  }
}

function getDashboardDateLabel(locale: string, timeZone?: string) {
  return formatCapitalizedDate(
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
    locale,
    timeZone,
  );
}

function getAgendaDateLabel(locale: string, timeZone?: string) {
  return formatCapitalizedDate(
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
    locale,
    timeZone,
  );
}

const kpis = [
  {
    title: "Mantenimientos pendientes",
    value: "-",
    detail: "Sin datos reales",
    icon: "🛠️",
    accent: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Trabajos programados hoy",
    value: "-",
    detail: "Sin datos reales",
    icon: "📅",
    accent: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Clientes activos",
    value: "-",
    detail: "Sin datos reales",
    icon: "👥",
    accent: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Facturas pendientes",
    value: "-",
    detail: "Sin datos reales",
    icon: "🧾",
    accent: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const agenda = [
  {
    time: "09:00",
    title: "Mantenimiento preventivo",
    place: "Edificio Torres del Sol",
    status: "Completado",
    statusClass: "bg-emerald-50 text-emerald-700",
  },
  {
    time: "11:30",
    title: "Revisión de ascensores",
    place: "Centro Comercial Norte",
    status: "En progreso",
    statusClass: "bg-amber-50 text-amber-700",
  },
  {
    time: "14:00",
    title: "Mantenimiento correctivo",
    place: "Planta Industrial ABC",
    status: "Programado",
    statusClass: "bg-blue-50 text-blue-700",
  },
  {
    time: "16:30",
    title: "Inspección general",
    place: "Condominio Los Olivos",
    status: "Programado",
    statusClass: "bg-blue-50 text-blue-700",
  },
];

const activity = [
  {
    icon: "✅",
    text: "Se completó el mantenimiento en",
    strong: "Edificio Torres del Sol",
    time: "09:15",
    bg: "bg-emerald-50",
  },
  {
    icon: "🛠️",
    text: "Nuevo mantenimiento programado para",
    strong: "Planta Industrial ABC",
    time: "08:45",
    bg: "bg-orange-50",
  },
  {
    icon: "🧾",
    text: "Factura creada para",
    strong: "Centro Comercial Norte",
    time: "Ayer, 17:30",
    bg: "bg-purple-50",
  },
  {
    icon: "👤",
    text: "Nuevo cliente registrado:",
    strong: "Transportes del Sur S.A.",
    time: "Ayer, 16:20",
    bg: "bg-blue-50",
  },
  {
    icon: "📞",
    text: "Intento de contacto con",
    strong: "Constructora Andina",
    time: "Ayer, 11:05",
    bg: "bg-amber-50",
  },
];

function MiniSparkline({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 40"
      className={`h-10 w-28 ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 32 C14 25, 22 30, 32 21 S51 22, 60 14 S75 34, 84 24 S105 19, 118 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function Home() {
  const { locale, timeZone } = await getHomeSettings();

  const dashboardDateLabel = getDashboardDateLabel(locale, timeZone);
  const agendaDateLabel = getAgendaDateLabel(locale, timeZone);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6 text-slate-900 md:px-8 lg:px-10">
      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Bienvenido, José 👋
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Controla tus clientes, instalaciones, mantenimientos, rutas y
              finanzas desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-4 lg:items-end">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-lg shadow-sm transition hover:bg-slate-50"
                aria-label="Notificaciones"
              >
                🔔
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  3
                </span>
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <span>📅</span>
                <span>{dashboardDateLabel}</span>
                <span className="text-slate-400">⌄</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
              <a
                href="/clients/new"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Crear cliente
              </a>

              <a
                href="/follow-ups/new"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Agendar mantenimiento
              </a>

              <a
                href="/finances"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Nueva factura
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`rounded-2xl ${item.bg} p-3 text-xl`}>
                  {item.icon}
                </div>

                <MiniSparkline className={item.accent} />
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold text-slate-600">
                  {item.title}
                </p>

                <p className={`mt-2 text-3xl font-bold ${item.accent}`}>
                  {item.value}
                </p>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {item.detail}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr_1.35fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Agenda de hoy
                </h2>

                <p className="mt-1 text-sm font-medium text-blue-600">
                  {agendaDateLabel}
                </p>
              </div>

              <a
                href="/calendar"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Ver calendario
              </a>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {agenda.map((item) => (
                <div
                  key={`${item.time}-${item.title}`}
                  className="grid grid-cols-[64px_1fr] gap-4 py-4"
                >
                  <p className="text-sm font-bold text-slate-700">
                    {item.time}
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {item.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.place}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${item.statusClass}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="/calendar"
              className="mt-3 flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Ver agenda completa →
            </a>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-950">
                Actividad reciente
              </h2>

              <a
                href="/clients"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Ver todas
              </a>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {activity.map((item) => (
                <div
                  key={`${item.text}-${item.time}`}
                  className="flex gap-4 py-4"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.bg}`}
                  >
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-5 text-slate-500">
                        {item.text}
                        <br />
                        <span className="font-bold text-slate-900">
                          {item.strong}
                        </span>
                      </p>

                      <span className="shrink-0 text-xs font-medium text-slate-400">
                        {item.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="/clients"
              className="mt-3 flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Ver toda la actividad →
            </a>
          </section>

          <div className="flex flex-col gap-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-950">
                  Centro operativo
                </h2>

                <a
                  href="/operations-center"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Ver rutas
                </a>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_160px]">
                <div className="relative min-h-52 overflow-hidden rounded-2xl bg-slate-100">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.25)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.25)_1px,transparent_1px)] bg-[size:28px_28px]" />

                  <svg
                    viewBox="0 0 500 220"
                    className="absolute inset-0 h-full w-full"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M55 160 C120 120, 150 150, 200 90 S300 80, 340 45 S420 70, 455 35"
                      stroke="#2563eb"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />

                    <path
                      d="M70 70 C125 92, 150 130, 220 142 S315 165, 430 130"
                      stroke="#f59e0b"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />

                    <path
                      d="M260 178 C310 135, 365 140, 430 82"
                      stroke="#9333ea"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute left-[17%] top-[57%] h-6 w-6 rounded-full border-4 border-white bg-orange-500 shadow" />
                  <div className="absolute left-[40%] top-[36%] h-8 w-8 rounded-full border-4 border-white bg-slate-950 shadow" />
                  <div className="absolute left-[66%] top-[74%] h-6 w-6 rounded-full border-4 border-white bg-blue-600 shadow" />
                  <div className="absolute left-[80%] top-[34%] h-6 w-6 rounded-full border-4 border-white bg-emerald-500 shadow" />
                  <div className="absolute left-[78%] top-[58%] h-6 w-6 rounded-full border-4 border-white bg-purple-600 shadow" />
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-500">
                      Técnicos en campo
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-950">-</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-500">
                      Trabajos en curso
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-950">-</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-500">
                      Rutas activas
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-950">-</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-950">
                  Cobros / facturación
                </h2>

                <a
                  href="/finances"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Ver finanzas
                </a>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Facturado este mes
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-950">-</p>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Sin datos reales
                  </p>

                  <MiniSparkline className="mt-3 text-emerald-600" />
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Pendiente de cobro
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-950">-</p>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Sin datos reales
                  </p>

                  <MiniSparkline className="mt-3 text-orange-600" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
