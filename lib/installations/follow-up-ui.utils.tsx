import { InstallationFollowUp } from "./installation-detail.types";

function normalizeDate(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getFollowUpTimingState(followUp: InstallationFollowUp) {
  if (followUp.follow_up_status?.code === "completed") {
    return "completed";
  }

  if (!followUp.target_date) {
    return "no-date";
  }

  const today = normalizeDate(new Date());
  const target = normalizeDate(new Date(followUp.target_date));

  if (target < today) return "overdue";
  if (target.getTime() === today.getTime()) return "today";
  return "upcoming";
}

export function getFollowUpCardClass(followUp: InstallationFollowUp) {
  const state = getFollowUpTimingState(followUp);

  if (state === "completed") {
    return "rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm";
  }

  if (state === "no-date") {
    return "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm";
  }

  if (state === "overdue") {
    return "rounded-3xl border border-red-200 bg-white p-5 shadow-sm";
  }

  if (state === "today") {
    return "rounded-3xl border border-yellow-200 bg-white p-5 shadow-sm";
  }

  return "rounded-3xl border border-green-200 bg-white p-5 shadow-sm";
}

export function getFollowUpAccentClass(followUp: InstallationFollowUp) {
  const state = getFollowUpTimingState(followUp);

  if (state === "completed") return "bg-emerald-500";
  if (state === "no-date") return "bg-slate-300";
  if (state === "overdue") return "bg-red-500";
  if (state === "today") return "bg-yellow-500";
  return "bg-green-500";
}

export function getFollowUpStateLabel(followUp: InstallationFollowUp) {
  const state = getFollowUpTimingState(followUp);

  if (state === "completed") return "✅ Completado";
  if (state === "no-date") return "🕓 Sin fecha";
  if (state === "overdue") return "⚠️ Vencido";
  if (state === "today") return "📌 Hoy";
  return "🟢 Próximo";
}

export function getScheduleBadge(followUp: InstallationFollowUp) {
  const state = getFollowUpTimingState(followUp);

  if (state === "completed") {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Completado
      </span>
    );
  }

  if (state === "no-date") {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
        Sin fecha
      </span>
    );
  }

  if (state === "overdue") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        Vencido
      </span>
    );
  }

  if (state === "today") {
    return (
      <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
        Hoy
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
      Próximo
    </span>
  );
}
