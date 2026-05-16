import FormSection from "@/components/clients/form/FormSection";
import FormInput from "@/components/clients/form/FormInput";

type ClientFinanceSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  paymentTerm: "CASH" | "CREDIT";
  creditDays: string;
  creditLimit: string;
  discountRate: string;
  preferredCurrency: "CRC" | "USD";
  taxExempt: boolean;
  setPaymentTerm: (value: "CASH" | "CREDIT") => void;
  setCreditDays: (value: string) => void;
  setCreditLimit: (value: string) => void;
  setDiscountRate: (value: string) => void;
  setPreferredCurrency: (value: "CRC" | "USD") => void;
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
    <FormSection
      title="Configuración financiera"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <p className="mb-5 text-sm text-slate-500">
        Reglas comerciales opcionales para crédito, descuentos e impuestos.
      </p>

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
              placeholder="Ejemplo: 500000"
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
            onChange={(e) =>
              setPreferredCurrency(e.target.value as "CRC" | "USD")
            }
            className={selectClass}
          >
            <option value="CRC">Colones costarricenses</option>
            <option value="USD">Dólares estadounidenses</option>
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <label
            htmlFor="tax_exempt"
            className="flex cursor-pointer items-center gap-3"
          >
            <input
              id="tax_exempt"
              type="checkbox"
              checked={taxExempt}
              onChange={(e) => setTaxExempt(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Exento de IVA
              </p>
              <p className="text-xs text-slate-500">
                Marque esta opción si al cliente no se le debe aplicar IVA.
              </p>
            </div>
          </label>
        </div>
      </div>
    </FormSection>
  );
}
