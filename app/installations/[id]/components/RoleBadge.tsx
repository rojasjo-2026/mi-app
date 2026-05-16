import { formatRole } from "@/lib/installations/installation-detail.utils";

type RoleBadgeProps = {
  role: string;
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
      {formatRole(role)}
    </span>
  );
}
