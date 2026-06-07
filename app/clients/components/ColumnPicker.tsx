import {
  OPTIONAL_COLUMNS,
  type ToggleableColumnKey,
} from "../config/clientsPageConfig";

type ColumnPickerProps = {
  isOpen: boolean;
  visibleColumns: Record<ToggleableColumnKey, boolean>;
  onToggleColumn: (columnKey: ToggleableColumnKey) => void;
};

export function ColumnPicker({
  isOpen,
  visibleColumns,
  onToggleColumn,
}: ColumnPickerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
      <div className="px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Columnas visibles
        </p>

        <p className="mt-1 text-xs font-medium text-slate-500">
          Cliente siempre permanece visible.
        </p>
      </div>

      <div className="space-y-1">
        {OPTIONAL_COLUMNS.map((column) => (
          <label
            key={column.key}
            className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={visibleColumns[column.key]}
              onChange={() => onToggleColumn(column.key)}
              className="h-4 w-4 rounded border-slate-300"
            />

            <span>{column.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
