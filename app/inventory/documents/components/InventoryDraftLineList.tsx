"use client";

import { Loader2, PackagePlus, Pencil, Trash2 } from "lucide-react";

import type { InventoryDraftLine } from "./inventoryDraftLines.types";

import { formatInventoryDocumentMoney } from "../utils/inventoryDocumentUi";

import { formatQuantity } from "./inventoryDraftLines.utils";

type InventoryDraftLineListProps = {
  lines: InventoryDraftLine[];
  locale: string;
  currency: string;
  editingLine: InventoryDraftLine | null;
  pendingDeleteId: string | null;
  deletingLineId: string | null;
  busy: boolean;
  onStartEditing: (line: InventoryDraftLine) => void;
  onCancelDelete: () => void;
  onDelete: (line: InventoryDraftLine) => Promise<void>;
};

export default function InventoryDraftLineList({
  lines,
  locale,
  currency,
  editingLine,
  pendingDeleteId,
  deletingLineId,
  busy,
  onStartEditing,
  onCancelDelete,
  onDelete,
}: InventoryDraftLineListProps) {
  const totalCost = lines.reduce(
    (total, line) => total + Number(line.total_cost),
    0,
  );

  return (
    <div className="flex min-h-0 flex-col bg-slate-50">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">
            Productos agregados
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {lines.length} producto
            {lines.length === 1 ? "" : "s"} en el borrador
          </p>
        </div>

        <p className="text-sm font-semibold tabular-nums text-slate-950 sm:hidden">
          {formatInventoryDocumentMoney(String(totalCost), locale, currency)}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {lines.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-5 text-center">
            <PackagePlus
              className="h-8 w-8 text-slate-300"
              aria-hidden="true"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Todavía no hay productos
            </p>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              Selecciona un producto, indica la cantidad y agrégalo al borrador.
            </p>
          </div>
        ) : (
          lines.map((line) => {
            const confirmingDelete =
              pendingDeleteId === line.inventory_document_line_id;

            const deleting = deletingLineId === line.inventory_document_line_id;

            return (
              <article
                key={line.inventory_document_line_id}
                className={[
                  "rounded-lg border bg-white p-4 shadow-sm transition",
                  editingLine?.inventory_document_line_id ===
                  line.inventory_document_line_id
                    ? "border-blue-300 ring-4 ring-blue-50"
                    : "border-slate-200",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {line.product_name_snapshot}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {line.variant_name_snapshot || "Variante principal"} ·{" "}
                      {line.code_snapshot || line.unit_code_snapshot}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-950">
                      {formatInventoryDocumentMoney(
                        line.total_cost,
                        locale,
                        currency,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Línea {line.line_number}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 rounded-md bg-slate-50 px-3 py-2.5">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400">
                      Cantidad
                    </p>

                    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-700">
                      {formatQuantity(line.quantity, locale)}{" "}
                      {line.unit_code_snapshot}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-400">
                      Costo unitario
                    </p>

                    <p className="mt-1 text-sm font-semibold tabular-nums text-slate-700">
                      {formatInventoryDocumentMoney(
                        line.unit_cost,
                        locale,
                        currency,
                      )}
                    </p>
                  </div>
                </div>

                {line.notes ? (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {line.notes}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {confirmingDelete ? (
                    <button
                      type="button"
                      onClick={onCancelDelete}
                      disabled={busy}
                      className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onStartEditing(line)}
                    disabled={busy}
                    className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => void onDelete(line)}
                    disabled={busy}
                    className={[
                      "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                      confirmingDelete
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700",
                    ].join(" ")}
                  >
                    {deleting ? (
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    )}

                    {confirmingDelete ? "Confirmar" : "Quitar"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
