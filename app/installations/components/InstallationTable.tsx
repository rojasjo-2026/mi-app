"use client";

import Link from "next/link";
import type {
  Dispatch,
  MouseEvent as ReactMouseEvent,
  SetStateAction,
} from "react";
import { CalendarDays, MapPin, UserRound } from "lucide-react";
import {
  COLUMN_LABELS,
  type ColumnKey,
  type InstallationItem,
  type SortDirection,
  type SortKey,
} from "../config/installationsPageConfig";
import {
  formatCurrency,
  formatDateLabel,
  getClientName,
  getInitials,
  getInstallationCode,
  getInstallationStatusLabel,
  getLocationLabel,
  getStatusBadgeClass,
} from "../utils/installationsPageUtils";
import { TableHeaderCell } from "./TableHeaderCell";
import { TableBodyCell } from "./TableBodyCell";
import { InstallationPagination } from "./InstallationPagination";

type InstallationTableProps = {
  installations: InstallationItem[];
  selectedInstallationId: string | null;
  displayedColumns: ColumnKey[];
  gridTemplateColumns: string;
  tableMinWidth: number;
  pageStartIndex: number;
  pageSize: number;
  safeCurrentPage: number;
  totalPages: number;
  loading: boolean;
  sortKey: SortKey;
  sortDirection: SortDirection;
  businessCurrency: string;
  businessLocale: string;
  onSelectInstallation: (installationId: string) => void;
  onHeaderSort: (sortKey: SortKey) => void;
  onResizeStart: (
    event: ReactMouseEvent<HTMLSpanElement>,
    columnKey: ColumnKey,
  ) => void;
  onPageSizeChange: (value: number) => void;
  setCurrentPage: Dispatch<SetStateAction<number>>;
};

export function InstallationTable({
  installations,
  selectedInstallationId,
  displayedColumns,
  gridTemplateColumns,
  tableMinWidth,
  pageStartIndex,
  pageSize,
  safeCurrentPage,
  totalPages,
  loading,
  sortKey,
  sortDirection,
  businessCurrency,
  businessLocale,
  onSelectInstallation,
  onHeaderSort,
  onResizeStart,
  onPageSizeChange,
  setCurrentPage,
}: InstallationTableProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
                sortKey={column === "actions" ? undefined : column}
                activeSortKey={sortKey}
                sortDirection={sortDirection}
                onSort={onHeaderSort}
                onResizeStart={onResizeStart}
              />
            ))}
          </div>

          <ul className="divide-y divide-slate-100">
            {installations.map((item, index) => {
              const installationName =
                item.description || "Instalación sin descripción";
              const clientName = getClientName(item.client);
              const installationCode = getInstallationCode(
                item,
                pageStartIndex + index - 1,
              );
              const isSelected =
                item.installation_id === selectedInstallationId;

              return (
                <li
                  key={item.installation_id}
                  role="button"
                  tabIndex={0}
                  data-selected={isSelected ? "true" : "false"}
                  onClick={() => onSelectInstallation(item.installation_id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectInstallation(item.installation_id);
                    }
                  }}
                  style={{ gridTemplateColumns }}
                  className={[
                    "group grid min-h-[82px] cursor-pointer transition hover:bg-blue-50/70",
                    isSelected
                      ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                      : "bg-white",
                  ].join(" ")}
                >
                  {displayedColumns.includes("installation") && (
                    <TableBodyCell columnKey="installation">
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={[
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black transition",
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
                          ].join(" ")}
                        >
                          {getInitials(installationName)}
                        </div>

                        <div className="min-w-0">
                          <Link
                            href={`/installations/${item.installation_id}`}
                            className="block"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <h2
                              title={installationName}
                              className="truncate text-sm font-black text-slate-950 transition hover:text-blue-700"
                            >
                              {installationName}
                            </h2>
                          </Link>

                          <p
                            title={installationCode}
                            className="mt-1 truncate text-xs font-medium text-slate-500"
                          >
                            {installationCode}
                          </p>
                        </div>
                      </div>
                    </TableBodyCell>
                  )}

                  {displayedColumns.includes("client") && (
                    <TableBodyCell columnKey="client">
                      <div className="min-w-0">
                        <p
                          title={clientName}
                          className="truncate text-sm font-bold text-slate-800"
                        >
                          {clientName}
                        </p>

                        <p
                          title={item.client?.phone_primary || "Sin teléfono"}
                          className="mt-1 truncate text-xs text-slate-500"
                        >
                          {item.client?.phone_primary || "Sin teléfono"}
                        </p>
                      </div>
                    </TableBodyCell>
                  )}

                  {displayedColumns.includes("service") && (
                    <TableBodyCell columnKey="service">
                      <span
                        title={item.service_type?.name || "Sin servicio"}
                        className="truncate text-sm font-semibold text-slate-700"
                      >
                        {item.service_type?.name || "Sin servicio"}
                      </span>
                    </TableBodyCell>
                  )}

                  {displayedColumns.includes("date") && (
                    <TableBodyCell columnKey="date">
                      <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
                        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                        <span
                          title={formatDateLabel(
                            item.installation_date,
                            businessLocale,
                          )}
                          className="truncate"
                        >
                          {formatDateLabel(
                            item.installation_date,
                            businessLocale,
                          )}
                        </span>
                      </div>
                    </TableBodyCell>
                  )}

                  {displayedColumns.includes("technician") && (
                    <TableBodyCell columnKey="technician">
                      <div className="flex min-w-0 items-center gap-2">
                        <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                        <span
                          title={item.technician_name || "Técnico no asignado"}
                          className="truncate text-sm font-semibold text-slate-700"
                        >
                          {item.technician_name || "Técnico no asignado"}
                        </span>
                      </div>
                    </TableBodyCell>
                  )}

                  {displayedColumns.includes("location") && (
                    <TableBodyCell columnKey="location">
                      <div className="flex min-w-0 items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        <span
                          title={getLocationLabel(item)}
                          className="truncate text-sm font-semibold text-slate-700"
                        >
                          {getLocationLabel(item)}
                        </span>
                      </div>
                    </TableBodyCell>
                  )}

                  {displayedColumns.includes("amount") && (
                    <TableBodyCell columnKey="amount">
                      <span
                        title={formatCurrency(
                          item.estimated_amount,
                          businessCurrency,
                          businessLocale,
                        )}
                        className="truncate text-sm font-bold text-slate-800"
                      >
                        {formatCurrency(
                          item.estimated_amount,
                          businessCurrency,
                          businessLocale,
                        )}
                      </span>
                    </TableBodyCell>
                  )}

                  {displayedColumns.includes("status") && (
                    <TableBodyCell columnKey="status">
                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                          item.installation_status,
                        )}`}
                      >
                        {getInstallationStatusLabel(item.installation_status)}
                      </span>
                    </TableBodyCell>
                  )}

                  {displayedColumns.includes("actions") && (
                    <TableBodyCell columnKey="actions" className="justify-end">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/installations/${item.installation_id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                          Ver detalle
                        </Link>
                      </div>
                    </TableBodyCell>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <InstallationPagination
        pageSize={pageSize}
        safeCurrentPage={safeCurrentPage}
        totalPages={totalPages}
        loading={loading}
        onPageSizeChange={onPageSizeChange}
        setCurrentPage={setCurrentPage}
      />
    </section>
  );
}
