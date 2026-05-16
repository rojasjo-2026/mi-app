import type { FinanceMenuItem } from "../types";
import { financeMenu } from "../types";

type FinanceMenuProps = {
  activeSection: FinanceMenuItem;
  onChange: (section: FinanceMenuItem) => void;
};

export default function FinanceMenu({
  activeSection,
  onChange,
}: FinanceMenuProps) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        Menú
      </p>

      <nav className="space-y-2">
        {financeMenu.map((item) => {
          const active = item === activeSection;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
