"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  MoreVertical,
  Search,
  UserRound,
} from "lucide-react";
import {
  COUNTRY_PRESETS,
  getCountryPreset,
} from "@/lib/settings/countryPresets";

type InstallationItem = {
  installation_id: string;
  installation_date: string;
  description: string | null;
  technician_name: string | null;
  installation_status: string;
  estimated_amount?: number | null;
  zone?: string | null;
  city?: string | null;
  address_line?: string | null;
  client?: {
    first_name?: string | null;
    last_name_1?: string | null;
    last_name_2?: string | null;
    phone_primary?: string | null;
  } | null;
  service_type?: {
    name?: string | null;
  } | null;
};

type FilterType = "all" | "OPEN" | "IN_PROGRESS" | "CLOSED" | "CANCELLED";
type SortType = "recent" | "oldest";

type AppSettingsResponse = {
  success: boolean;
  data?: {
    country_code?: string | null;
    default_currency?: string | null;
  } | null;
};

type ColumnKey =
  | "installation"
  | "client"
  | "service"
  | "date"
  | "technician"
  | "location"
  | "amount"
  | "status"
  | "actions";

type OptionalColumnKey = Exclude<ColumnKey, "installation" | "actions">;

type ColumnWidths = Record<ColumnKey, number>;
type VisibleColumns = Record<OptionalColumnKey, boolean>;

const DEFAULT_COUNTRY_CODE = "CR";

const fallbackCountryPreset =
  getCountryPreset(DEFAULT_COUNTRY_CODE) ?? Object.values(COUNTRY_PRESETS)[0];

const STATUS_FILTERS: { label: string; value: FilterType }[] = [
  { label: "Todas", value: "all" },
  { label: "Abiertas", value: "OPEN" },
  { label: "En proceso", value: "IN_PROGRESS" },
  { label: "Completadas", value: "CLOSED" },
  { label: "Canceladas", value: "CANCELLED" },
];

const OPTIONAL_COLUMNS: { key: OptionalColumnKey; label: string }[] = [
  { key: "client", label: "Cliente" },
  { key: "service", label: "Servicio" },
  { key: "date", label: "Fecha" },
  { key: "technician", label: "Técnico" },
  { key: "location", label: "Ubicación" },
  { key: "amount", label: "Monto estimado" },
  { key: "status", label: "Estado" },
];

const COLUMN_LABELS: Record<ColumnKey, string> = {
  installation: "Instalación",
  client: "Cliente",
  service: "Servicio",
  date: "Fecha",
  technician: "Técnico",
  location: "Ubicación",
  amount: "Monto estimado",
  status: "Estado",
  actions: "Acciones",
};

const INITIAL_COLUMN_WIDTHS: ColumnWidths = {
  installation: 340,
  client: 220,
  service: 210,
  date: 130,
  technician: 220,
  location: 270,
  amount: 165,
  status: 140,
  actions: 210,
};

const MIN_COLUMN_WIDTHS: ColumnWidths = {
  installation: 300,
  client: 170,
  service: 160,
  date: 110,
  technician: 170,
  location: 190,
  amount: 135,
  status: 120,
  actions: 210,
};

const INITIAL_VISIBLE_COLUMNS: VisibleColumns = {
  client: true,
  service: true,
  date: true,
  technician: true,
  location: true,
  amount: true,
  status: true,
};

function getBusinessCountryMeta(settings?: AppSettingsResponse["data"]) {
  const countryPreset =
    getCountryPreset(settings?.country_code) ?? fallbackCountryPreset;

  return {
    currency: settings?.default_currency || countryPreset.primaryCurrency,
    locale: countryPreset.locale,
  };
}

function getFilterButtonClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition"
    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50";
}

function getInstallationStatusLabel(status?: string | null) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "OPEN") return "Abierta";
  if (normalized === "IN_PROGRESS") return "En proceso";
  if (normalized === "CLOSED") return "Completada";
  if (normalized === "CANCELLED") return "Cancelada";

  return status || "Sin estado";
}

function getStatusBadgeClass(status?: string | null) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "OPEN") {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalized === "IN_PROGRESS") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalized === "CLOSED") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "CANCELLED") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function formatDateLabel(value?: string | null, locale = "es-CR") {
  if (!value) return "No disponible";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(locale, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatCurrency(
  value?: number | null,
  currency = "CRC",
  locale = "es-CR",
) {
  if (value == null) return "No definido";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString(locale, {
      maximumFractionDigits: 0,
    })}`;
  }
}

function getClientName(client?: InstallationItem["client"]) {
  const composedName = [
    client?.first_name,
    client?.last_name_1,
    client?.last_name_2,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return composedName || "Cliente sin nombre";
}

function getLocationLabel(item: InstallationItem) {
  const parts = [item.city, item.zone]
    .filter(Boolean)
    .map((value) => value!.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return item.address_line || "Ubicación no definida";
  }

  return parts.join(", ");
}

function getInstallationCode(item: InstallationItem, index: number) {
  const shortId = item.installation_id?.slice(0, 4).toUpperCase() || "0000";
  return `INST-${String(index + 1).padStart(4, "0")}-${shortId}`;
}

function getInitials(value: string) {
  const words = value.trim().split(" ").filter(Boolean);

  if (words.length === 0) return "IN";

  const first = words[0]?.charAt(0) ?? "";
  const second = words[1]?.charAt(0) ?? "";

  return `${first}${second}`.toUpperCase();
}

function getStickyHeaderClass(columnKey: ColumnKey) {
  if (columnKey === "installation") {
    return "sticky left-0 z-30 bg-slate-50 shadow-[8px_0_16px_-16px_rgba(15,23,42,0.45)]";
  }

  if (columnKey === "actions") {
    return "sticky right-0 z-30 bg-slate-50 shadow-[-8px_0_16px_-16px_rgba(15,23,42,0.45)]";
  }

  return "";
}

function getStickyBodyClass(columnKey: ColumnKey) {
  if (columnKey === "installation") {
    return "sticky left-0 z-20 bg-white shadow-[8px_0_16px_-16px_rgba(15,23,42,0.45)] group-hover:bg-slate-50";
  }

  if (columnKey === "actions") {
    return "sticky right-0 z-20 bg-white shadow-[-8px_0_16px_-16px_rgba(15,23,42,0.45)] group-hover:bg-slate-50";
  }

  return "";
}

function TableHeaderCell({
  columnKey,
  label,
  onResizeStart,
}: {
  columnKey: ColumnKey;
  label: string;
  onResizeStart: (
    event: ReactMouseEvent<HTMLSpanElement>,
    columnKey: ColumnKey,
  ) => void;
}) {
  const isLockedColumn =
    columnKey === "installation" || columnKey === "actions";

  return (
    <div
      className={[
        "relative flex h-full items-center border-r border-slate-200 px-4 py-3 last:border-r-0",
        getStickyHeaderClass(columnKey),
        columnKey === "actions" ? "justify-end text-right" : "",
      ].join(" ")}
    >
      <span className="truncate text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>

      {!isLockedColumn && (
        <span
          role="separator"
          aria-label={`Cambiar ancho de ${label}`}
          onMouseDown={(event) => onResizeStart(event, columnKey)}
          className="absolute right-0 top-0 h-full w-2 cursor-col-resize transition hover:bg-blue-200/70"
        />
      )}
    </div>
  );
}

function TableBodyCell({
  children,
  columnKey,
  className = "",
}: {
  children: React.ReactNode;
  columnKey: ColumnKey;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex min-w-0 items-center border-r border-slate-100 px-4 py-3 last:border-r-0",
        getStickyBodyClass(columnKey),
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function InstallationsPage() {
  const [installations, setInstallations] = useState<InstallationItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(
    INITIAL_COLUMN_WIDTHS,
  );
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(
    INITIAL_VISIBLE_COLUMNS,
  );
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement | null>(null);

  const defaultBusinessMeta = useMemo(() => getBusinessCountryMeta(), []);
  const [businessCurrency, setBusinessCurrency] = useState(
    defaultBusinessMeta.currency,
  );
  const [businessLocale, setBusinessLocale] = useState(
    defaultBusinessMeta.locale,
  );

  const displayedColumns = useMemo<ColumnKey[]>(() => {
    const middleColumns = OPTIONAL_COLUMNS.filter(
      (column) => visibleColumns[column.key],
    ).map((column) => column.key);

    return ["installation", ...middleColumns, "actions"];
  }, [visibleColumns]);

  const gridTemplateColumns = useMemo(
    () =>
      displayedColumns.map((column) => `${columnWidths[column]}px`).join(" "),
    [displayedColumns, columnWidths],
  );

  const tableMinWidth = useMemo(
    () =>
      displayedColumns.reduce(
        (total, column) => total + columnWidths[column],
        0,
      ),
    [displayedColumns, columnWidths],
  );

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

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isColumnMenuOpen]);

  useEffect(() => {
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

        setBusinessCurrency(businessMeta.currency);
        setBusinessLocale(businessMeta.locale);
      } catch {
        // Keep default business metadata if settings cannot be loaded.
      }
    }

    async function loadInstallations() {
      try {
        await loadBusinessSettings();

        const response = await fetch("/api/installations", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "No se pudieron cargar las instalaciones",
          );
        }

        setInstallations(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar las instalaciones",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadInstallations();
  }, []);

  const filteredInstallations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = installations.filter((item) => {
      const currentStatus = String(
        item.installation_status || "",
      ).toUpperCase();

      const matchesFilter = filter === "all" ? true : currentStatus === filter;

      if (!matchesFilter) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        item.description,
        item.technician_name,
        item.client?.first_name,
        item.client?.last_name_1,
        item.client?.last_name_2,
        item.service_type?.name,
        item.city,
        item.zone,
        item.address_line,
        getInstallationStatusLabel(item.installation_status),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });

    filtered.sort((a, b) => {
      const aDate = new Date(a.installation_date).getTime();
      const bDate = new Date(b.installation_date).getTime();

      if (sortBy === "oldest") {
        return aDate - bDate;
      }

      return bDate - aDate;
    });

    return filtered;
  }, [installations, search, filter, sortBy]);

  function startColumnResize(
    event: ReactMouseEvent<HTMLSpanElement>,
    columnKey: ColumnKey,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = columnWidths[columnKey];
    const minWidth = MIN_COLUMN_WIDTHS[columnKey];

    function handleMouseMove(mouseEvent: MouseEvent) {
      const nextWidth = Math.max(
        minWidth,
        startWidth + mouseEvent.clientX - startX,
      );

      setColumnWidths((current) => ({
        ...current,
        [columnKey]: nextWidth,
      }));
    }

    function handleMouseUp() {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function toggleColumn(columnKey: OptionalColumnKey) {
    setVisibleColumns((current) => ({
      ...current,
      [columnKey]: !current[columnKey],
    }));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-[1500px] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-600">
            Cargando instalaciones...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
        <div className="mx-auto max-w-[1500px] rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/60 p-6 text-slate-900 md:p-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
              Gestión de instalaciones
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Instalaciones
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Gestiona las instalaciones registradas y crea nuevas.
            </p>
          </div>

          <Link
            href="/installations/new"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Nueva instalación
          </Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Buscar instalación
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por cliente, descripción, técnico, servicio o ubicación"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Estado de instalación
                </p>

                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((statusFilter) => (
                    <button
                      key={statusFilter.value}
                      type="button"
                      onClick={() => setFilter(statusFilter.value)}
                      className={getFilterButtonClass(
                        filter === statusFilter.value,
                      )}
                    >
                      {statusFilter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div ref={columnMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsColumnMenuOpen((current) => !current)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Columnas
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>

                  {isColumnMenuOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        Mostrar columnas
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                        Instalación y Acciones siempre permanecen visibles.
                      </div>

                      <div className="mt-2">
                        {OPTIONAL_COLUMNS.map((column) => (
                          <label
                            key={column.key}
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={visibleColumns[column.key]}
                              onChange={() => toggleColumn(column.key)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            {column.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-500">
                    Ordenar por
                  </span>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortType)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-300"
                  >
                    <option value="recent">Más recientes</option>
                    <option value="oldest">Más antiguas</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Mostrando{" "}
              <span className="font-bold">{filteredInstallations.length}</span>{" "}
              de <span className="font-bold">{installations.length}</span>{" "}
              instalaciones
            </div>
          </div>
        </section>

        {filteredInstallations.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-base font-bold text-slate-800">
              No se encontraron instalaciones
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Prueba con otro filtro o registra una nueva instalación.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
                      onResizeStart={startColumnResize}
                    />
                  ))}
                </div>

                <ul className="divide-y divide-slate-100">
                  {filteredInstallations.map((item, index) => {
                    const installationName =
                      item.description || "Instalación sin descripción";
                    const clientName = getClientName(item.client);
                    const installationCode = getInstallationCode(item, index);

                    return (
                      <li
                        key={item.installation_id}
                        style={{ gridTemplateColumns }}
                        className="group grid min-h-[82px] transition hover:bg-slate-50"
                      >
                        {displayedColumns.includes("installation") && (
                          <TableBodyCell columnKey="installation">
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">
                                {getInitials(installationName)}
                              </div>

                              <div className="min-w-0">
                                <Link
                                  href={`/installations/${item.installation_id}`}
                                  className="block"
                                >
                                  <h2
                                    title={installationName}
                                    className="truncate text-sm font-black text-slate-950 transition hover:text-blue-700"
                                  >
                                    {installationName}
                                  </h2>
                                </Link>

                                <p className="mt-1 truncate text-xs font-medium text-slate-500">
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

                              <p className="mt-1 truncate text-xs text-slate-500">
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
                              <span className="truncate">
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
                                title={
                                  item.technician_name || "Técnico no asignado"
                                }
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
                            <span className="truncate text-sm font-bold text-slate-800">
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
                              {getInstallationStatusLabel(
                                item.installation_status,
                              )}
                            </span>
                          </TableBodyCell>
                        )}

                        {displayedColumns.includes("actions") && (
                          <TableBodyCell
                            columnKey="actions"
                            className="justify-end"
                          >
                            <div className="flex items-center justify-end gap-3">
                              <Link
                                href={`/installations/${item.installation_id}`}
                                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                              >
                                Ver detalle
                              </Link>

                              <details className="relative">
                                <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
                                  <MoreVertical className="h-4 w-4" />
                                </summary>

                                <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                                  <Link
                                    href={`/installations/${item.installation_id}/edit`}
                                    className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Editar
                                  </Link>
                                </div>
                              </details>
                            </div>
                          </TableBodyCell>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
