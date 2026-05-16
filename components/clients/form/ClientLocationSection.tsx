import FormSection from "@/components/clients/form/FormSection";
import FormInput from "@/components/clients/form/FormInput";

type LocationOption = {
  nombre: string;
};

type ClientLocationSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  adminLevel1: string;
  adminLevel2: string;
  adminLevel3: string;
  addressLine: string;
  provinciaOptions: string[];
  cantonOptions: LocationOption[];
  distritoOptions: LocationOption[];
  handleProvinceChange: (value: string) => void;
  handleCantonChange: (value: string) => void;
  setAdminLevel3: (value: string) => void;
  setAddressLine: (value: string) => void;
  selectClass: string;
  inputClass: string;
};

export default function ClientLocationSection({
  isOpen,
  onToggle,
  adminLevel1,
  adminLevel2,
  adminLevel3,
  addressLine,
  provinciaOptions,
  cantonOptions,
  distritoOptions,
  handleProvinceChange,
  handleCantonChange,
  setAdminLevel3,
  setAddressLine,
  selectClass,
  inputClass,
}: ClientLocationSectionProps) {
  return (
    <FormSection title="Ubicación" isOpen={isOpen} onToggle={onToggle}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Provincia
          </label>
          <select
            value={adminLevel1}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Seleccione provincia</option>
            {provinciaOptions.map((provincia) => (
              <option key={provincia} value={provincia}>
                {provincia}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Cantón
          </label>
          <select
            value={adminLevel2}
            onChange={(e) => handleCantonChange(e.target.value)}
            disabled={!adminLevel1}
            className={selectClass}
          >
            <option value="">Seleccione cantón</option>
            {cantonOptions.map((canton) => (
              <option key={canton.nombre} value={canton.nombre}>
                {canton.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Distrito
          </label>
          <select
            value={adminLevel3}
            onChange={(e) => setAdminLevel3(e.target.value)}
            disabled={!adminLevel1 || !adminLevel2}
            className={selectClass}
          >
            <option value="">Seleccione distrito</option>
            {distritoOptions.map((distrito) => (
              <option key={distrito.nombre} value={distrito.nombre}>
                {distrito.nombre}
              </option>
            ))}
          </select>
        </div>

        <FormInput
          label="Dirección"
          value={addressLine}
          onChange={setAddressLine}
          inputClass={inputClass}
          placeholder="Detalle adicional de la dirección"
          full
        />
      </div>
    </FormSection>
  );
}
