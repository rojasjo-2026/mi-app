type Props = {
  todayEventsCount: number;
  overdueEventsCount: number;
  upcomingEventsCount: number;
  installationEventsCount: number;
};

export default function CalendarStats({
  todayEventsCount,
  overdueEventsCount,
  upcomingEventsCount,
  installationEventsCount,
}: Props) {
  return (
    <section className="mb-6 grid gap-4 md:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Hoy</p>
        <p className="mt-1 text-2xl font-bold">{todayEventsCount}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Vencidos</p>
        <p className="mt-1 text-2xl font-bold text-red-600">
          {overdueEventsCount}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Próximos</p>
        <p className="mt-1 text-2xl font-bold text-green-600">
          {upcomingEventsCount}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Instalaciones</p>
        <p className="mt-1 text-2xl font-bold text-blue-600">
          {installationEventsCount}
        </p>
      </div>
    </section>
  );
}
