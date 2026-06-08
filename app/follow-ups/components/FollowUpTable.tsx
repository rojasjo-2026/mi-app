"use client";

import Link from "next/link";
import type { MouseEvent as ReactMouseEvent } from "react";
import { CalendarDays, MapPin, UserRound, Wrench } from "lucide-react";
import { COLUMN_LABELS } from "../constants/followUpsPageConstants";
import type {
  ColumnKey,
  FollowUp,
  SortDirection,
  SortKey,
  VisibleColumns,
} from "../types/followUpsPageTypes";
import {
  formatDateLabel,
  formatMaintenanceType,
  formatMoney,
  getBillingStatusClasses,
  getBillingStatusLabel,
  getClientName,
  getMainAmount,
  getPriorityClasses,
  getPriorityLabel,
  getStatusClasses,
  getTechnicianName,
  getTimingMeta,
} from "../utils/followUpsPageUtils";
import { TableHeaderCell } from "./TableHeaderCell";
import { TableBodyCell } from "./TableBodyCell";

type FollowUpTableProps = {
  items: FollowUp[];
  selectedFollowUpId: string | null;
  displayedColumns: ColumnKey[];
  visibleColumns: VisibleColumns;
  gridTemplateColumns: string;
  tableMinWidth: number;
  pageStartIndex: number;
  sortKey: SortKey;
  sortDirection: SortDirection;
  businessCurrency: string;
  businessLocale: string;
  onSelectFollowUp: (followUpId: string) => void;
  onHeaderSort: (sortKey: SortKey) => void;
  onResizeStart: (
    event: ReactMouseEvent<HTMLSpanElement>,
    columnKey: ColumnKey,
  ) => void;
};

export function FollowUpTable({
  items,
  selectedFollowUpId,
  displayedColumns,
  visibleColumns,
  gridTemplateColumns,
  tableMinWidth,
  pageStartIndex,
  sortKey,
  sortDirection,
  businessCurrency,
  businessLocale,
  onSelectFollowUp,
  onHeaderSort,
  onResizeStart,
}: FollowUpTableProps) {
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: tableMinWidth }}>
        <div
          style={{ gridTemplateColumns }}
          className="grid border-b border-slate-200 bg-slate-50"
        >
          {displayedColumns.map((column) => (
            <TableHeaderCell
              key={column}
              columnKey={column}
              label={COLUMN_LABELS[column]}
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onHeaderSort}
              onResizeStart={onResizeStart}
            />
          ))}
        </div>

        <ul className="divide-y divide-slate-100">
          {items.map((item) => {
            const clientName = getClientName(item.client);
            const maintenanceType = formatMaintenanceType(
              item.maintenance_type,
            );
            const technicianName = getTechnicianName(item.technician);
            const targetDate = formatDateLabel(
              item.target_date,
              businessLocale,
            );
            const scheduledDate = formatDateLabel(
              item.scheduled_date,
              businessLocale,
            );
            const timingMeta = getTimingMeta(
              item.target_date,
              item.follow_up_status?.code,
            );
            const amount = getMainAmount(item);
            const isSelected = item.follow_up_id === selectedFollowUpId;

            return (
              <li
                key={item.follow_up_id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectFollowUp(item.follow_up_id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectFollowUp(item.follow_up_id);
                  }
                }}
                style={{ gridTemplateColumns }}
                className={[
                  "group grid min-h-[76px] cursor-pointer transition hover:bg-blue-50/70",
                  isSelected
                    ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                    : "bg-white",
                ].join(" ")}
              >
                <TableBodyCell columnKey="maintenance" isSelected={isSelected}>
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black transition",
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
                      ].join(" ")}
                    >
                      <Wrench className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/follow-ups/${item.follow_up_id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="block"
                      >
                        <h2
                          title={clientName}
                          className="truncate text-sm font-black text-slate-950 transition hover:text-blue-700"
                        >
                          {clientName}
                        </h2>
                      </Link>

                      <p
                        title={maintenanceType}
                        className="mt-1 truncate text-xs font-medium text-slate-500"
                      >
                        {maintenanceType}
                      </p>
                    </div>
                  </div>
                </TableBodyCell>

                {visibleColumns.client && (
                  <TableBodyCell columnKey="client" isSelected={isSelected}>
                    <div className="min-w-0">
                      <p
                        title={item.client?.phone_primary || "Sin teléfono"}
                        className="truncate text-sm font-semibold text-slate-700"
                      >
                        {item.client?.phone_primary || "Sin teléfono"}
                      </p>

                      <p
                        title={item.reason || "Mantenimiento programado"}
                        className="mt-1 truncate text-xs text-slate-500"
                      >
                        {item.reason || "Mantenimiento programado"}
                      </p>
                    </div>
                  </TableBodyCell>
                )}

                {visibleColumns.installation && (
                  <TableBodyCell
                    columnKey="installation"
                    isSelected={isSelected}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" />

                      <span
                        title={
                          item.installation?.description ||
                          "Sin instalación asociada"
                        }
                        className="truncate text-sm font-semibold text-slate-700"
                      >
                        {item.installation?.description ||
                          "Sin instalación asociada"}
                      </span>
                    </div>
                  </TableBodyCell>
                )}

                {visibleColumns.targetDate && (
                  <TableBodyCell columnKey="targetDate" isSelected={isSelected}>
                    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
                      <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />

                      <span
                        title={targetDate || "No disponible"}
                        className="truncate"
                      >
                        {targetDate || "No disponible"}
                      </span>
                    </div>
                  </TableBodyCell>
                )}

                {visibleColumns.scheduledDate && (
                  <TableBodyCell
                    columnKey="scheduledDate"
                    isSelected={isSelected}
                  >
                    <span
                      title={scheduledDate || "Sin agendar"}
                      className="truncate text-sm font-semibold text-slate-700"
                    >
                      {scheduledDate || "Sin agendar"}
                    </span>
                  </TableBodyCell>
                )}

                {visibleColumns.technician && (
                  <TableBodyCell columnKey="technician" isSelected={isSelected}>
                    <div className="flex min-w-0 items-center gap-2">
                      <UserRound className="h-4 w-4 shrink-0 text-slate-400" />

                      <span
                        title={technicianName}
                        className="truncate text-sm font-semibold text-slate-700"
                      >
                        {technicianName}
                      </span>
                    </div>
                  </TableBodyCell>
                )}

                {visibleColumns.priority && (
                  <TableBodyCell columnKey="priority" isSelected={isSelected}>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getPriorityClasses(
                        item.priority,
                      )}`}
                    >
                      {getPriorityLabel(item.priority)}
                    </span>
                  </TableBodyCell>
                )}

                {visibleColumns.amount && (
                  <TableBodyCell columnKey="amount" isSelected={isSelected}>
                    <span
                      title={
                        amount === null
                          ? "No definido"
                          : formatMoney(
                              amount,
                              businessCurrency,
                              businessLocale,
                            )
                      }
                      className="truncate text-sm font-bold text-slate-800"
                    >
                      {amount === null
                        ? "No definido"
                        : formatMoney(amount, businessCurrency, businessLocale)}
                    </span>
                  </TableBodyCell>
                )}

                {visibleColumns.billing && (
                  <TableBodyCell columnKey="billing" isSelected={isSelected}>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getBillingStatusClasses(
                        item.billing_status,
                      )}`}
                    >
                      {getBillingStatusLabel(item.billing_status)}
                    </span>
                  </TableBodyCell>
                )}

                {visibleColumns.status && (
                  <TableBodyCell columnKey="status" isSelected={isSelected}>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(
                          item.follow_up_status?.code,
                        )}`}
                      >
                        {item.follow_up_status?.name || "Sin estado"}
                      </span>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${timingMeta.classes}`}
                      >
                        {timingMeta.label}
                      </span>
                    </div>
                  </TableBodyCell>
                )}

                <TableBodyCell
                  columnKey="actions"
                  isSelected={isSelected}
                  className="justify-end"
                >
                  <Link
                    href={`/follow-ups/${item.follow_up_id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Ver detalle
                  </Link>
                </TableBodyCell>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
