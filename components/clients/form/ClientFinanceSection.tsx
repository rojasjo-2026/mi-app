"use client";

import FormInput from "@/components/clients/form/FormInput";
import ClientFormSectionHeader from "@/components/clients/form/ClientFormSectionHeader";
import type { CountryPreset } from "@/lib/settings/countryPresets";

type CurrencyOption = {
  value: string;
  label: string;
};

type ClientFinanceSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  paymentTerm: "CASH" | "CREDIT";
  creditDays: string;
  creditLimit: string;
  discountRate: string;
  preferredCurrency: string;
  taxExempt: boolean;
  countryPreset: CountryPreset;
  currencyOptions: CurrencyOption[];
  setPaymentTerm: (value: "CASH" | "CREDIT") => void;
  setCreditDays: (value: string) => void;
  setCreditLimit: (value: string) => void;
  setDiscountRate: (value: string) => void;
  setPreferredCurrency: (value: string) => void;
  setTaxExempt: (value: boolean) => void;
  selectClass: string;
  inputClass: string;
};

export default function ClientFinanceSection({
  isOpen,
  onToggle,
  paymentTerm,
  creditDays,
  creditLimit,
  discountRate,
  preferredCurrency,
  taxExempt,
  countryPreset,
  currencyOptions,
  setPaymentTerm,
  setCreditDays,
  setCreditLimit,
  setDiscountRate,
  setPreferredCurrency,
  setTaxExempt,
  selectClass,
  inputClass,
}: ClientFinanceSectionProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <ClientFormSectionHeader
        icon="💳"
        title="Configuración financiera"
        description="Define reglas comerciales opcionales para crédito, descuentos, moneda e impuestos."
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Tipo de pago
              </label>

              <select
                value={paymentTerm}
                onChange={(e) =>
                  setPaymentTerm(e.target.value as "CASH" | "CREDIT")
                }
                className={selectClass}
              >
                <option value="CASH">Contado</option>
                <option value="CREDIT">Crédito</option>
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Regla actual
              </p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {paymentTerm === "CREDIT"
                  ? "Cliente con crédito"
                  : "Cliente de contado"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {paymentTerm === "CREDIT"
                  ? "Se habilitan días y límite de crédito para futuras facturas."
                  : "No se requieren días ni límite de crédito."}
              </p>
            </div>

            {paymentTerm === "CREDIT" && (
              <>
                <FormInput
                  label="Días de crédito *"
                  value={creditDays}
                  onChange={setCreditDays}
                  inputClass={inputClass}
                  type="number"
                  placeholder="Ejemplo: 30"
                  required
                />

                <FormInput
                  label="Límite de crédito"
                  value={creditLimit}
                  onChange={setCreditLimit}
                  inputClass={inputClass}
                  type="number"
                  placeholder={`Ejemplo: ${countryPreset.currencySymbol} 500000`}
                />
              </>
            )}

            <FormInput
              label="Descuento por defecto (%)"
              value={discountRate}
              onChange={setDiscountRate}
              inputClass={inputClass}
              type="number"
              placeholder="Ejemplo: 10"
            />

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Moneda preferida
              </label>

              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className={selectClass}
              >
                {currencyOptions.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={[
                "rounded-2xl border px-4 py-4 transition md:col-span-2",
                taxExempt
                  ? "border-orange-100 bg-orange-50/70"
                  : "border-slate-200 bg-slate-50",
              ].join(" ")}
            >
              <label
                htmlFor="tax_exempt"
                className="flex cursor-pointer items-start gap-3"
              >
                <input
                  id="tax_exempt"
                  type="checkbox"
                  checked={taxExempt}
                  onChange={(e) => setTaxExempt(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      Exento de {countryPreset.taxLabel}
                    </p>

                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        taxExempt
                          ? "bg-orange-100 text-orange-700"
                          : "bg-slate-200 text-slate-600",
                      ].join(" ")}
                    >
                      {taxExempt ? "Exento" : "Aplica impuesto"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Marque esta opción si al cliente no se le debe aplicar{" "}
                    {countryPreset.taxLabel}.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
