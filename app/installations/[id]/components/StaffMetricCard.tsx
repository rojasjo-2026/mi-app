import RoleBadge from "./RoleBadge";

type StaffMetricCardProps = {
  label: string;
  name: string;
  role?: string;
  isActive?: boolean | null;
  isLinked?: boolean;
};

export default function StaffMetricCard({
  label,
  name,
  role,
  isActive,
  isLinked,
}: StaffMetricCardProps) {
  const isEmpty = !name || name === "Sin asignar";

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <div className="mt-1 space-y-2">
        <p
          className={`truncate text-sm font-semibold ${
            isEmpty ? "text-slate-400" : "text-slate-950"
          }`}
        >
          {name}
        </p>

        <div className="flex flex-wrap gap-2">
          {role ? <RoleBadge role={role} /> : null}

          {isLinked ? (
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                isActive === false
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }`}
            >
              {isActive === false ? "Inactivo" : "Asignado"}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
