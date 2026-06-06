"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FinanceInvoiceDraftForm from "@/components/finance/FinanceInvoiceDraftForm";
import type { PendingBillable, PendingBillablesResponse } from "../types";
import {
  formatCurrency,
  formatDateLabel,
  getBillingStatusClass,
  getBillingStatusLabel,
  toSafeNumber,
} from "../utils";
import FinanceSummaryCard from "./FinanceSummaryCard";
import SectionHeader from "./SectionHeader";
import {
  COLUMN_LABELS,
  DEFAULT_VISIBLE_COLUMNS,
  OPTIONAL_COLUMNS,
  PAGE_SIZE_OPTIONS,
  type AppSettingsResponse,
  type ColumnKey,
  type OptionalColumnKey,
  type PaginationState,
  type PendingBillablesSectionProps,
  type PendingSortKey,
  type SortDirection,
  type VisibleColumns,
} from "./pending-billables/pendingBillablesSectionConfig";
import {
  getBusinessCountryMeta,
  getGridTemplate,
  getItemAmount,
  getItemProfit,
  getTypeLabel,
} from "./pending-billables/pendingBillablesSectionUtils";
import { SortableHeader } from "./pending-billables/SortableHeader";
import { ColumnPicker } from "./pending-billables/ColumnPicker";
import { PendingBillablePanel } from "./pending-billables/PendingBillablePanel";

export default function PendingBillablesSection({
  items,
  summary,
  loading,
  error,
  search,
  status,
  dateFrom,
  dateTo,
  selectedBillable,
  pagination,
  pageSize,
  sortKey,
  sortDirection,
  onSearchChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onRefresh,
  onSelectBillable,
  onClearSelection,
  onInvoiceCreated,
  onPageChange,
  onPageSizeChange,
  onSortChange,
}: PendingBillablesSectionProps) {
  const defaultBusinessMeta = useMemo(() => getBusinessCountryMeta(), []);
  const [businessCurrency, setBusinessCurrency] = useState(
    defaultBusinessMeta.currency,
  );
  const [businessLocale, setBusinessLocale] = useState(
    defaultBusinessMeta.locale,
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(
    DEFAULT_VISIBLE_COLUMNS,
  );
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  const displayedColumns = useMemo<ColumnKey[]>(() => {
    const optionalColumns = OPTIONAL_COLUMNS.filter(
      (column) => visibleColumns[column.key],
    ).map((column) => column.key);

    return ["client", ...optionalColumns, "action"];
  }, [visibleColumns]);

  const gridTemplateColumns = useMemo(
    () => getGridTemplate(displayedColumns),
    [displayedColumns],
  );

  const selectedItem = useMemo(
    () =>
      items.find((item) => `${item.type}-${item.id}` === selectedItemId) ??
      items[0] ??
      null,
    [items, selectedItemId],
  );

  const resolvedSortKey: PendingSortKey = sortKey ?? "date";
  const resolvedSortDirection: SortDirection = sortDirection ?? "desc";
  const resolvedPageSize = pageSize ?? (items.length || 25);
  const resolvedPagination: PaginationState = pagination ?? {
    page: 1,
    pageSize: resolvedPageSize,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / resolvedPageSize)),
  };

  const visibleTotal = resolvedPagination.totalItems;
  const totalPages = Math.max(1, resolvedPagination.totalPages);
  const safeCurrentPage = Math.min(resolvedPagination.page || 1, totalPages);
  const pageStartIndex =
    visibleTotal === 0 ? 0 : (safeCurrentPage - 1) * resolvedPageSize + 1;
  const pageEndIndex = Math.min(
    safeCurrentPage * resolvedPageSize,
    visibleTotal,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadBusinessSettings() {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
        });

        const result: AppSettingsResponse = await response.json();

        if (!response.ok || !result.success) {
          return;
        }

        const businessMeta = getBusinessCountryMeta(result.data);

        if (!isMounted) return;

        setBusinessCurrency(businessMeta.currency);
        setBusinessLocale(businessMeta.locale);
      } catch {
        // Keep default business metadata if settings cannot be loaded.
      }
    }

    void loadBusinessSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!isColumnMenuOpen) return;

      const target = event.target;

      if (
        target instanceof Node &&
        columnMenuRef.current &&
        !columnMenuRef.current.contains(target)
      ) {
        setIsColumnMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);

    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [isColumnMenuOpen]);

  function toggleColumn(columnKey: OptionalColumnKey) {
    setVisibleColumns((current) => ({
      ...current,
      [columnKey]: !current[columnKey],
    }));
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Trabajos pendientes"
          title="Trabajos pendientes para facturar"
          description="Instalaciones y mantenimientos con estado comercial pendiente."
        />

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <FinanceSummaryCard
          label="Trabajos"
          value={String(
            summary?.count ?? resolvedPagination.totalItems ?? items.length,
          )}
          helper="Listos para revisar"
        />

        <FinanceSummaryCard
          label="Monto estimado"
          value={formatCurrency(
            summary?.total_amount ?? 0,
            businessCurrency,
            businessLocale,
          )}
          helper="Total pendiente"
        />

        <FinanceSummaryCard
          label="Utilidad estimada"
          value={formatCurrency(
            summary?.estimated_profit ?? 0,
            businessCurrency,
            businessLocale,
          )}
          helper="Monto menos costo"
        />
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 xl:grid-cols-[1fr_190px_160px_160px_150px_145px]">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por cliente, teléfono, cédula o descripción del trabajo..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />

          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="ALL">Todos pendientes</option>
            <option value="PENDING">Pendiente</option>
            <option value="BILLING_ERROR">Error de facturación</option>
          </select>

          <label className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Desde
            </span>
            <input
              type="date"
              value={dateFrom ?? ""}
              onChange={(e) => onDateFromChange?.(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
            />
          </label>

          <label className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Hasta
            </span>
            <input
              type="date"
              value={dateTo ?? ""}
              onChange={(e) => onDateToChange?.(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
            />
          </label>

          <div ref={columnMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsColumnMenuOpen((current) => !current)}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              Columnas
            </button>

            <ColumnPicker
              isOpen={isColumnMenuOpen}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
          </div>

          <label className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm">
            Ver
            <select
              value={resolvedPageSize}
              onChange={(event) =>
                onPageSizeChange?.(Number(event.target.value))
              }
              className="bg-transparent text-sm font-bold outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {selectedBillable && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Facturar trabajo seleccionado
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedBillable.client_name} · {selectedBillable.description}
              </p>
            </div>

            <button
              type="button"
              onClick={onClearSelection}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>

          <FinanceInvoiceDraftForm
            client={selectedBillable.client}
            installationId={
              selectedBillable.type === "INSTALLATION"
                ? selectedBillable.installation_id
                : null
            }
            followUpId={
              selectedBillable.type === "FOLLOW_UP"
                ? selectedBillable.follow_up_id
                : null
            }
            sourceType={selectedBillable.type}
            serviceDescription={selectedBillable.description}
            estimatedAmount={selectedBillable.estimated_amount}
            finalAmount={selectedBillable.final_amount}
            onInvoiceCreated={onInvoiceCreated}
          />
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Cargando trabajos pendientes...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            No hay trabajos pendientes para facturar con los filtros actuales.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                <div
                  style={{ gridTemplateColumns }}
                  className="grid border-b border-slate-200 bg-slate-50"
                >
                  {displayedColumns.map((column) => (
                    <SortableHeader
                      key={column}
                      columnKey={column}
                      label={COLUMN_LABELS[column]}
                      activeSortKey={resolvedSortKey}
                      sortDirection={resolvedSortDirection}
                      align={
                        column === "amount" ||
                        column === "cost" ||
                        column === "profit"
                          ? "right"
                          : column === "status" || column === "action"
                            ? "center"
                            : "left"
                      }
                      onSortChange={onSortChange ?? (() => undefined)}
                    />
                  ))}
                </div>

                <ul className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const itemKey = `${item.type}-${item.id}`;
                    const amount = getItemAmount(item);
                    const cost = toSafeNumber(item.cost_amount);
                    const profit = getItemProfit(item);
                    const isSelected =
                      selectedItem?.id === item.id &&
                      selectedItem?.type === item.type;

                    return (
                      <li
                        key={itemKey}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedItemId(itemKey)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedItemId(itemKey);
                          }
                        }}
                        style={{ gridTemplateColumns }}
                        className={`grid min-h-[74px] cursor-pointer transition hover:bg-blue-50/70 ${
                          isSelected
                            ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                            : "bg-white"
                        }`}
                      >
                        {displayedColumns.map((column) => {
                          if (column === "client") {
                            return (
                              <div
                                key={column}
                                className="min-w-0 border-r border-slate-100 px-4 py-3"
                              >
                                <p
                                  title={item.client_name || "-"}
                                  className="truncate text-sm font-black text-slate-950"
                                >
                                  {item.client_name || "-"}
                                </p>
                                <p
                                  title={item.client_phone || "Sin teléfono"}
                                  className="mt-1 truncate text-xs font-medium text-slate-500"
                                >
                                  {item.client_phone || "Sin teléfono"}
                                </p>
                              </div>
                            );
                          }

                          if (column === "type") {
                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center border-r border-slate-100 px-4 py-3"
                              >
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                                  {getTypeLabel(item)}
                                </span>
                              </div>
                            );
                          }

                          if (column === "work") {
                            return (
                              <div
                                key={column}
                                className="min-w-0 border-r border-slate-100 px-4 py-3"
                              >
                                <p
                                  title={item.description || "-"}
                                  className="truncate text-sm font-bold text-slate-900"
                                >
                                  {item.description || "-"}
                                </p>
                                {item.billing_notes && (
                                  <p
                                    title={item.billing_notes}
                                    className="mt-1 truncate text-xs font-medium text-slate-500"
                                  >
                                    {item.billing_notes}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          if (column === "date") {
                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  title={formatDateLabel(
                                    item.date,
                                    businessLocale,
                                  )}
                                  className="truncate text-sm font-semibold text-slate-700"
                                >
                                  {formatDateLabel(item.date, businessLocale)}
                                </span>
                              </div>
                            );
                          }

                          if (column === "amount") {
                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center justify-end border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  title={formatCurrency(
                                    amount,
                                    businessCurrency,
                                    businessLocale,
                                  )}
                                  className="truncate text-sm font-black text-slate-900"
                                >
                                  {formatCurrency(
                                    amount,
                                    businessCurrency,
                                    businessLocale,
                                  )}
                                </span>
                              </div>
                            );
                          }

                          if (column === "cost") {
                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center justify-end border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  title={formatCurrency(
                                    cost,
                                    businessCurrency,
                                    businessLocale,
                                  )}
                                  className="truncate text-sm font-bold text-slate-800"
                                >
                                  {formatCurrency(
                                    cost,
                                    businessCurrency,
                                    businessLocale,
                                  )}
                                </span>
                              </div>
                            );
                          }

                          if (column === "profit") {
                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center justify-end border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  title={formatCurrency(
                                    profit,
                                    businessCurrency,
                                    businessLocale,
                                  )}
                                  className="truncate text-sm font-bold text-emerald-700"
                                >
                                  {formatCurrency(
                                    profit,
                                    businessCurrency,
                                    businessLocale,
                                  )}
                                </span>
                              </div>
                            );
                          }

                          if (column === "status") {
                            return (
                              <div
                                key={column}
                                className="flex min-w-0 items-center justify-center border-r border-slate-100 px-4 py-3"
                              >
                                <span
                                  className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getBillingStatusClass(
                                    item.billing_status,
                                  )}`}
                                >
                                  {getBillingStatusLabel(item.billing_status)}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={column}
                              className="flex min-w-0 items-center justify-center px-4 py-3"
                            >
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onSelectBillable(item);
                                }}
                                className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                              >
                                Generar factura
                              </button>
                            </div>
                          );
                        })}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Mostrando {pageStartIndex}-{pageEndIndex} de {visibleTotal}{" "}
                trabajos · Página {safeCurrentPage} de {totalPages}
                {loading && items.length > 0 ? " · Actualizando..." : ""}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onPageChange?.(Math.max(1, safeCurrentPage - 1))
                  }
                  disabled={safeCurrentPage <= 1}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onPageChange?.(Math.min(totalPages, safeCurrentPage + 1))
                  }
                  disabled={safeCurrentPage >= totalPages}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>

          <PendingBillablePanel
            item={selectedItem}
            businessCurrency={businessCurrency}
            businessLocale={businessLocale}
            onSelectBillable={onSelectBillable}
          />
        </div>
      )}
    </div>
  );
}

