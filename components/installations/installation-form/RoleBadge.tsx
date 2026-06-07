import { formatRole } from "./installationFormUtils";

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {formatRole(role)}
    </span>
  );
}

