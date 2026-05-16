"use client";

import { useEffect, useState } from "react";
import FinanceInvoiceDraftForm from "@/components/finance/FinanceInvoiceDraftForm";
import type { PendingBillable, PendingBillablesResponse } from "../types";
import PendingBillablesSection from "./PendingBillablesSection";
import SectionHeader from "./SectionHeader";

type PaymentTerm = "CASH" | "CREDIT";
type InvoiceMode = "PENDING_WORK" | "MANUAL" | null;

type FinanceClient = {
  client_id: string;
  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
  phone_primary?: string | null;
  email?: string | null;
  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: string | null;
  tax_id?: string | null;
  default_payment_term?: PaymentTerm | null;
  default_credit_days?: number | null;
  default_discount_rate?: number | string | null;
  tax_exempt?: boolean | null;
};

function buildClientName(client: FinanceClient) {
  return (
    client.billing_name ||
    [client.first_name, client.last_name_1, client.last_name_2]
      .filter(Boolean)
      .join(" ")
  );
}

function getClientsFromResponse(result: any): FinanceClient[] {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.clients)) return result.data.clients;
  if (Array.isArray(result?.clients)) return result.clients;

  return [];
}

export default function NewInvoiceSection() {
  const [mode, setMode] = useState<InvoiceMode>(null);

  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<FinanceClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<FinanceClient | null>(
    null,
  );

  const [serviceDescription, setServiceDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [loadingClients, setLoadingClients] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualMessage, setManualMessage] = useState("");

  const [pendingBillables, setPendingBillables] = useState<PendingBillable[]>(
    [],
  );
  const [pendingSummary, setPendingSummary] =
    useState<PendingBillablesResponse["summary"]>();
  const [loadingPendingBillables, setLoadingPendingBillables] = useState(false);
  const [pendingBillablesError, setPendingBillablesError] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingStatus, setPendingStatus] = useState("ALL");
  const [selectedBillable, setSelectedBillable] =
    useState<PendingBillable | null>(null);

  async function loadClients(searchValue = search) {
    setLoadingClients(true);
    setManualError("");
    setManualMessage("");

    try {
      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      const query = params.toString();

      const res = await fetch(`/api/clients${query ? `?${query}` : ""}`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "No se pudieron cargar clientes");
      }

      setClients(getClientsFromResponse(result));
    } catch (err) {
      console.error(err);
      setManualError("No se pudieron cargar clientes");
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }

  async function loadPendingBillables() {
    setLoadingPendingBillables(true);
    setPendingBillablesError("");

    try {
      const params = new URLSearchParams();

      if (pendingSearch.trim()) {
        params.set("search", pendingSearch.trim());
      }

      if (pendingStatus) {
        params.set("status", pendingStatus);
      }

      const query = params.toString();

      const res = await fetch(
        `/api/finance/pending-billables${query ? `?${query}` : ""}`,
        {
          cache: "no-store",
        },
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "No se pudieron cargar los trabajos pendientes",
        );
      }

      const data = result.data as PendingBillablesResponse;

      setPendingBillables(Array.isArray(data.items) ? data.items : []);
      setPendingSummary(data.summary);
    } catch (error) {
      console.error(error);
      setPendingBillablesError("No se pudieron cargar los trabajos pendientes");
      setPendingBillables([]);
      setPendingSummary(undefined);
    } finally {
      setLoadingPendingBillables(false);
    }
  }

  useEffect(() => {
    if (mode === "MANUAL") {
      loadClients("");
    }

    if (mode === "PENDING_WORK") {
      loadPendingBillables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleSelectClient(client: FinanceClient) {
    setSelectedClient(client);
    setManualMessage("");
    setManualError("");
  }

  function handleManualInvoiceCreated() {
    setManualMessage("Factura manual generada correctamente.");
    setSelectedClient(null);
    setServiceDescription("");
    setAmount("");
    setSearch("");
    loadClients("");
  }

  function handlePendingInvoiceCreated() {
    setSelectedBillable(null);
    loadPendingBillables();
  }

  function resetManualForm() {
    setSelectedClient(null);
    setServiceDescription("");
    setAmount("");
    setManualError("");
    setManualMessage("");
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Nueva factura"
        title="Crear factura"
        description="Seleccione si desea facturar un trabajo pendiente o crear una factura manual."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            setMode("PENDING_WORK");
            resetManualForm();
          }}
          className={`rounded-3xl border p-5 text-left transition ${
            mode === "PENDING_WORK"
              ? "border-slate-950 bg-slate-950 text-white shadow-sm"
              : "border-slate-200 bg-slate-50/70 text-slate-900 hover:border-slate-300 hover:bg-white"
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-[0.18em] ${
              mode === "PENDING_WORK" ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Recomendado
          </p>

          <h3 className="mt-3 text-lg font-bold">Facturar trabajo pendiente</h3>

          <p
            className={`mt-2 text-sm ${
              mode === "PENDING_WORK" ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Use este flujo para generar una factura desde una instalación o
            mantenimiento ya registrado.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("MANUAL");
            setSelectedBillable(null);
          }}
          className={`rounded-3xl border p-5 text-left transition ${
            mode === "MANUAL"
              ? "border-slate-950 bg-slate-950 text-white shadow-sm"
              : "border-slate-200 bg-slate-50/70 text-slate-900 hover:border-slate-300 hover:bg-white"
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-[0.18em] ${
              mode === "MANUAL" ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Caso especial
          </p>

          <h3 className="mt-3 text-lg font-bold">Crear factura manual</h3>

          <p
            className={`mt-2 text-sm ${
              mode === "MANUAL" ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Use esta opción cuando la factura no viene de una instalación o
            mantenimiento registrado.
          </p>
        </button>
      </div>

      {!mode && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">
            Seleccione una opción para continuar.
          </p>
        </div>
      )}

      {mode === "PENDING_WORK" && (
        <div className="mt-6">
          <PendingBillablesSection
            items={pendingBillables}
            summary={pendingSummary}
            loading={loadingPendingBillables}
            error={pendingBillablesError}
            search={pendingSearch}
            status={pendingStatus}
            selectedBillable={selectedBillable}
            onSearchChange={setPendingSearch}
            onStatusChange={setPendingStatus}
            onRefresh={loadPendingBillables}
            onSelectBillable={setSelectedBillable}
            onClearSelection={() => setSelectedBillable(null)}
            onInvoiceCreated={handlePendingInvoiceCreated}
          />
        </div>
      )}

      {mode === "MANUAL" && (
        <div className="mt-6">
          {manualMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {manualMessage}
            </div>
          )}

          {manualError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {manualError}
            </div>
          )}

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Cliente
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Busque y seleccione el cliente al que se le generará la
                  factura.
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadClients("")}
                disabled={loadingClients}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingClients ? "Cargando..." : "Ver clientes"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_140px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadClients(search);
                  }
                }}
                placeholder="Buscar por nombre, teléfono, cédula o correo..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />

              <button
                type="button"
                onClick={() => loadClients(search)}
                disabled={loadingClients}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingClients ? "Buscando..." : "Buscar"}
              </button>
            </div>

            {loadingClients ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Cargando clientes...
                </p>
              </div>
            ) : clients.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                <p className="text-sm font-medium text-slate-500">
                  No hay clientes para mostrar. Cree un cliente primero o
                  intente otra búsqueda.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {clients.map((client) => {
                  const clientName = buildClientName(client);
                  const active = selectedClient?.client_id === client.client_id;

                  return (
                    <div
                      key={client.client_id}
                      className={`rounded-2xl border p-4 transition ${
                        active
                          ? "border-slate-950 bg-white shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {clientName || "Cliente sin nombre"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Teléfono:{" "}
                            {client.billing_phone ||
                              client.phone_primary ||
                              "-"}{" "}
                            · Email:{" "}
                            {client.billing_email || client.email || "-"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Cédula / ID fiscal: {client.tax_id || "-"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                            active
                              ? "border border-slate-950 bg-white text-slate-950"
                              : "bg-slate-950 text-white hover:bg-slate-800"
                          }`}
                        >
                          {active ? "Seleccionado" : "Seleccionar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Datos del servicio manual
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-slate-950">
                    {buildClientName(selectedClient)}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    Complete la descripción y el monto antes de generar la
                    factura.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cambiar cliente
                </button>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Descripción del servicio
                  </label>

                  <input
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Ejemplo: Servicio técnico especial"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">
                    Monto base
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Ejemplo: 50000"
                  />
                </div>
              </div>

              {serviceDescription.trim() && Number(amount) > 0 ? (
                <FinanceInvoiceDraftForm
                  client={selectedClient}
                  sourceType="MANUAL"
                  serviceDescription={serviceDescription}
                  estimatedAmount={Number(amount)}
                  finalAmount={null}
                  onInvoiceCreated={handleManualInvoiceCreated}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    Ingrese una descripción y un monto mayor a cero para cargar
                    el formulario de factura.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
