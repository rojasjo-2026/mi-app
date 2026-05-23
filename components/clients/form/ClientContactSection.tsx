import FormSection from "@/components/clients/form/FormSection";
import FormInput from "@/components/clients/form/FormInput";
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
  return (
    <FormSection
      title="Información de contacto"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormInput
          label="Teléfono principal / WhatsApp *"
          value={phonePrimary}
          onChange={setPhonePrimary}
          required
          inputClass={inputClass}
          placeholder={`Ej. ${phoneExample}`}
        />

        <FormInput
          label="Teléfono secundario"
          value={phoneSecondary}
          onChange={setPhoneSecondary}
          inputClass={inputClass}
          placeholder={`Ej. ${phoneExample}`}
        />

        <FormInput
          label="Email"
          value={email}
          onChange={setEmail}
          inputClass={inputClass}
          type="email"
          placeholder="correo@empresa.com"
        />

        {mode === "edit" && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Estado
            </label>
            <select
              value={clientStatus}
              onChange={(e) => setClientStatus(e.target.value as ClientStatus)}
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

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <label
          htmlFor="whatsapp_opt_in"
          className="flex cursor-pointer items-center gap-3"
        >
          <input
            id="whatsapp_opt_in"
            type="checkbox"
            checked={whatsappOptIn}
            onChange={(e) => setWhatsappOptIn(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              El cliente autoriza contacto por WhatsApp
            </p>
            <p className="text-xs text-slate-500">
              Se usará el teléfono principal para coordinación de servicios,
              mantenimientos, recordatorios y seguimiento.
            </p>
          </div>
        </label>
      </div>
    </FormSection>
  );
}
