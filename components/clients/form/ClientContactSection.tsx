"use client";

import FormInput from "@/components/clients/form/FormInput";
import ClientFormSectionHeader from "@/components/clients/form/ClientFormSectionHeader";
import {
  CLIENT_STATUS_OPTIONS,
  type ClientStatus,
} from "@/lib/clients/clientStatus";

type ClientContactSectionProps = {
  mode: "create" | "edit";
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  clientStatus: ClientStatus;
  whatsappOptIn: boolean;
  phoneExample: string;
  inputClass: string;
  selectClass: string;
  onToggle: () => void;
  isOpen: boolean;
  setPhonePrimary: (value: string) => void;
  setPhoneSecondary: (value: string) => void;
  setEmail: (value: string) => void;
  setClientStatus: (value: ClientStatus) => void;
  setWhatsappOptIn: (value: boolean) => void;
};

export default function ClientContactSection({
  mode,
  phonePrimary,
  phoneSecondary,
  email,
  clientStatus,
  whatsappOptIn,
  phoneExample,
  inputClass,
  selectClass,
  onToggle,
  isOpen,
  setPhonePrimary,
  setPhoneSecondary,
  setEmail,
  setClientStatus,
  setWhatsappOptIn,
}: ClientContactSectionProps) {
  const phonePlaceholder = phoneExample.trim()
    ? `Ej. ${phoneExample}`
    : "Ingrese el número de teléfono";

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <ClientFormSectionHeader
        icon="📞"
        title="Información de contacto"
        description="Registra los teléfonos, correo electrónico y autorización para contacto por WhatsApp."
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              label="Teléfono principal / WhatsApp *"
              value={phonePrimary}
              onChange={setPhonePrimary}
              required
              inputClass={inputClass}
              placeholder={phonePlaceholder}
            />

            <FormInput
              label="Teléfono secundario"
              value={phoneSecondary}
              onChange={setPhoneSecondary}
              inputClass={inputClass}
              placeholder={phonePlaceholder}
            />

            <FormInput
              label="Correo electrónico"
              value={email}
              onChange={setEmail}
              inputClass={inputClass}
              type="email"
              placeholder="correo@dominio.com"
            />

            {mode === "edit" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Estado
                </label>

                <select
                  value={clientStatus}
                  onChange={(event) =>
                    setClientStatus(event.target.value as ClientStatus)
                  }
                  className={selectClass}
                >
                  {CLIENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div
            className={[
              "mt-5 rounded-md border px-3 py-2.5 transition",
              whatsappOptIn
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <label
              htmlFor="whatsapp_opt_in"
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                id="whatsapp_opt_in"
                type="checkbox"
                checked={whatsappOptIn}
                onChange={(event) => setWhatsappOptIn(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-slate-100"
              />

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    El cliente autoriza contacto por WhatsApp
                  </p>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      whatsappOptIn
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600",
                    ].join(" ")}
                  >
                    {whatsappOptIn ? "Habilitado" : "Deshabilitado"}
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Se usará el teléfono principal para coordinación de servicios,
                  mantenimientos, recordatorios y seguimiento.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
