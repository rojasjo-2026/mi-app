import FormSection from "@/components/clients/form/FormSection";
import FormInput from "@/components/clients/form/FormInput";
import type { CountryPreset } from "@/lib/settings/countryPresets";

type LocationOption = {
  nombre: string;
};

type CountryOption = {
  value: string;
  label: string;
};

type ClientLocationSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  countryCode: string;
  countryPreset: CountryPreset;
  countryOptions: CountryOption[];
  adminLevel1: string;
  adminLevel2: string;
  adminLevel3: string;
  addressLine: string;
  provinciaOptions: string[];
  cantonOptions: LocationOption[];
  distritoOptions: LocationOption[];
  handleCountryChange: (value: string) => void;
  handleProvinceChange: (value: string) => void;
  handleCantonChange: (value: string) => void;
  setAdminLevel1: (value: string) => void;
  setAdminLevel2: (value: string) => void;
  setAdminLevel3: (value: string) => void;
  setAddressLine: (value: string) => void;
  selectClass: string;
  inputClass: string;
};

export default function ClientLocationSection({
  isOpen,
  onToggle,
  countryCode,
  countryPreset,
  adminLevel1,
  adminLevel2,
  adminLevel3,
  addressLine,
  provinciaOptions,
  cantonOptions,
  distritoOptions,
  handleProvinceChange,
  handleCantonChange,
  setAdminLevel1,
  setAdminLevel2,
  setAdminLevel3,
  setAddressLine,
  selectClass,
  inputClass,
}: ClientLocationSectionProps) {
  const isCostaRica = countryCode === "CR";
  const adminLevel3Label =
    countryPreset.adminLevel3Label ?? "Nivel administrativo 3";

  return (
    <FormSection title="Ubicación" isOpen={isOpen} onToggle={onToggle}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">País operativo</p>

          <p className="mt-1 text-sm font-medium text-slate-700">
            {countryPreset.countryName}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Este país viene de la Configuración del sistema y se aplica al
            negocio completo. Desde aquí no se cambia por cliente.
          </p>
        </div>

        {isCostaRica ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                {countryPreset.adminLevel1Label}
              </label>
              <select
                value={adminLevel1}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className={selectClass}
              >
                <option value="">
                  Seleccione {countryPreset.adminLevel1Label.toLowerCase()}
                </option>
                {provinciaOptions.map((provincia) => (
                  <option key={provincia} value={provincia}>
                    {provincia}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                {countryPreset.adminLevel2Label}
              </label>
              <select
                value={adminLevel2}
                onChange={(e) => handleCantonChange(e.target.value)}
                disabled={!adminLevel1}
                className={selectClass}
              >
                <option value="">
                  Seleccione {countryPreset.adminLevel2Label.toLowerCase()}
                </option>
                {cantonOptions.map((canton) => (
                  <option key={canton.nombre} value={canton.nombre}>
                    {canton.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                {adminLevel3Label}
              </label>
              <select
                value={adminLevel3}
                onChange={(e) => setAdminLevel3(e.target.value)}
                disabled={!adminLevel1 || !adminLevel2}
                className={selectClass}
              >
                <option value="">
                  Seleccione {adminLevel3Label.toLowerCase()}
                </option>
                {distritoOptions.map((distrito) => (
                  <option key={distrito.nombre} value={distrito.nombre}>
                    {distrito.nombre}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <FormInput
              label={countryPreset.adminLevel1Label}
              value={adminLevel1}
              onChange={setAdminLevel1}
              inputClass={inputClass}
              placeholder={countryPreset.adminLevel1Label}
            />

            <FormInput
              label={countryPreset.adminLevel2Label}
              value={adminLevel2}
              onChange={setAdminLevel2}
              inputClass={inputClass}
              placeholder={countryPreset.adminLevel2Label}
            />

            <FormInput
              label={adminLevel3Label}
              value={adminLevel3}
              onChange={setAdminLevel3}
              inputClass={inputClass}
              placeholder={adminLevel3Label}
              full
            />
          </>
        )}

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
