export type FollowUpDetail = {
  follow_up_id: string;
  target_date: string;
  due_date?: string | null;
  reason?: string | null;
  priority?: number | null;
  notes?: string | null;
  created_from?: string | null;
  completed_at?: string | null;

  estimated_amount?: number | null;
  final_amount?: number | null;
  cost_amount?: number | null;
  billing_status?: string | null;
  billing_notes?: string | null;
  maintenance_type?: string | null;
  technician_id?: string | null;

  client?: {
    client_id: string;
    first_name: string;
    last_name_1: string;
    last_name_2?: string | null;
    phone_primary?: string | null;
    email?: string | null;
  } | null;

  installation?: {
    installation_id: string;
    description?: string | null;
    installation_date?: string | null;
    technician_name?: string | null;
  } | null;

  technician?: {
    user_id?: string;
    id?: string;
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;

  follow_up_status?: {
    follow_up_status_id: number;
    code: string;
    name: string;
  } | null;

  contact_attempts?: Array<{
    contact_attempt_id: string;
    attempt_datetime: string;
    note_text?: string | null;
    next_action?: string | null;
    next_target_date?: string | null;
  }>;
};

export type FollowUpEditForm = {
  reason: string;
  priority: number;
  target_date: string;
  due_date: string;
  estimated_amount: string;
  final_amount: string;
  cost_amount: string;
  billing_status: string;
  billing_notes: string;
  maintenance_type: string;
  technician_id: string;
};

export function getClientFullName(client: FollowUpDetail["client"]) {
  if (!client) return "-";

  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

export function getTechnicianName(technician: FollowUpDetail["technician"]) {
  if (!technician) return "-";

  if (technician.full_name) return technician.full_name;
  if (technician.name) return technician.name;

  const composedName = [technician.first_name, technician.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedName || technician.email || "-";
}

export function getStatusClasses(status?: string) {
  if (status === "completed") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "postponed") {
    return "border border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border border-blue-200 bg-blue-50 text-blue-700";
}

export function getPriorityClasses(priority?: number | null) {
  if (priority === 1) {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (priority === 2) {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (priority === 3) {
    return "border border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-600";
}

export function getTimingMeta(targetDate?: string | null) {
  if (!targetDate) {
    return {
      label: "Sin fecha",
      classes: "border border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const parsed = new Date(targetDate);

  if (Number.isNaN(parsed.getTime())) {
    return {
      label: "Sin fecha",
      classes: "border border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  const target = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
  );

  if (target.getTime() < today.getTime()) {
    return {
      label: "Atrasado",
      classes: "border border-red-200 bg-red-50 text-red-700",
    };
  }

  if (target.getTime() === today.getTime()) {
    return {
      label: "Hoy",
      classes: "border border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Próximo",
    classes: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDate(value?: string | null, locale = "es") {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value?: string | null, locale = "es") {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
