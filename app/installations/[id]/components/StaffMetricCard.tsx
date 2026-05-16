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
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <div className="mt-2 space-y-2">
        <p
          className={`text-sm font-semibold ${
            name === "Sin asignar" ? "text-slate-400" : "text-slate-800"
          }`}
        >
          {name}
        </p>

        <div className="flex flex-wrap gap-2">
          {role && <RoleBadge role={role} />}
          {isLinked && (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                isActive === false
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {isActive === false ? "Inactivo" : "Asignado"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
