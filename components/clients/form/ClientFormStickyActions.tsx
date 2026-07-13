"use client";

type ClientFormStickyActionsProps = {
  mode: "create" | "edit";
  saving: boolean;
  completedSections: number;
  totalSections: number;
  onBack: () => void;
};

export default function ClientFormStickyActions({
  mode,
  saving,
  completedSections,
  totalSections,
  onBack,
}: ClientFormStickyActionsProps) {
  const submitLabel = saving
    ? "Guardando..."
    : mode === "create"
      ? "Guardar cliente"
      : "Guardar cambios";

  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-slate-50/90 px-4 py-4 backdrop-blur md:-mx-6 md:px-6 xl:-mx-8 xl:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {completedSections} de {totalSections} secciones completas
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Revisa la información antes de guardar el cliente.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
