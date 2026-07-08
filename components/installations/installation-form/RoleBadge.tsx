import { formatRole } from "./installationFormUtils";

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
      {formatRole(role)}
    </span>
  );
}
