"use client";

import FormInput from "@/components/clients/form/FormInput";
import ClientFormSectionHeader from "@/components/clients/form/ClientFormSectionHeader";

type ClientBillingSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  billingSameAsClient: boolean;
  billingName: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
  setBillingSameAsClient: (value: boolean) => void;
  setBillingName: (value: string) => void;
  setBillingEmail: (value: string) => void;
  setBillingPhone: (value: string) => void;
  setBillingAddress: (value: string) => void;
  inputClass: string;
};

export default function ClientBillingSection({
  isOpen,
  onToggle,
  billingSameAsClient,
  billingName,
  billingEmail,
  billingPhone,
  billingAddress,
  setBillingSameAsClient,
  setBillingName,
  setBillingEmail,
  setBillingPhone,
  setBillingAddress,
  inputClass,
}: ClientBillingSectionProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <ClientFormSectionHeader
        icon="🧾"
        title="Datos de facturación"
        description="Define si la facturación usará los datos principales del cliente o información personalizada."
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="p-5 md:p-6">
          <div
            className={[
              "mb-5 rounded-md border px-3 py-2.5 transition",
              billingSameAsClient
                ? "border-blue-200 bg-blue-50/70"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <label
              htmlFor="billing_same_as_client"
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                id="billing_same_as_client"
                type="checkbox"
                checked={billingSameAsClient}
                onChange={(event) =>
                  setBillingSameAsClient(event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-slate-100"
              />

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Usar la misma información del cliente para facturación
                  </p>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      billingSameAsClient
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-200 text-slate-600",
                    ].join(" ")}
                  >
                    {billingSameAsClient
                      ? "Datos principales"
                      : "Datos personalizados"}
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Si está marcado, se usará el nombre, teléfono, correo y
                  dirección principal del cliente para generar facturas.
                </p>
              </div>
            </label>
          </div>

          {!billingSameAsClient && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Nombre de facturación"
                value={billingName}
                onChange={setBillingName}
                inputClass={inputClass}
                placeholder="Nombre que aparecerá en la factura"
              />

              <FormInput
                label="Correo de facturación"
                value={billingEmail}
                onChange={setBillingEmail}
                inputClass={inputClass}
                type="email"
                placeholder="facturacion@dominio.com"
              />

              <FormInput
                label="Teléfono de facturación"
                value={billingPhone}
                onChange={setBillingPhone}
                inputClass={inputClass}
                placeholder="Teléfono para temas de cobro"
              />

              <FormInput
                label="Dirección de facturación"
                value={billingAddress}
                onChange={setBillingAddress}
                inputClass={inputClass}
                placeholder="Dirección que aparecerá en la factura"
              />
            </div>
          )}

          {billingSameAsClient && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-base shadow-sm">
                  ✅
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Facturación sincronizada con el cliente
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    No necesitas llenar campos adicionales. El sistema tomará la
                    información principal del cliente al crear facturas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
