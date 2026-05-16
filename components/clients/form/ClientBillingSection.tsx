import FormSection from "@/components/clients/form/FormSection";
import FormInput from "@/components/clients/form/FormInput";

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
    <FormSection
      title="Datos de facturación"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <p className="mb-5 text-sm text-slate-500">
        Puede reutilizar los datos principales del cliente o registrar datos de
        facturación diferentes.
      </p>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <label
          htmlFor="billing_same_as_client"
          className="flex cursor-pointer items-center gap-3"
        >
          <input
            id="billing_same_as_client"
            type="checkbox"
            checked={billingSameAsClient}
            onChange={(e) => setBillingSameAsClient(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Usar la misma información del cliente para facturación
            </p>
            <p className="text-xs text-slate-500">
              Si está marcado, se usará nombre, teléfono, email y dirección
              principal.
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
            label="Email de facturación"
            value={billingEmail}
            onChange={setBillingEmail}
            inputClass={inputClass}
            type="email"
          />

          <FormInput
            label="Teléfono de facturación"
            value={billingPhone}
            onChange={setBillingPhone}
            inputClass={inputClass}
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
    </FormSection>
  );
}
