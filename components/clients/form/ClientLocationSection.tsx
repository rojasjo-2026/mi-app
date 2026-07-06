"use client";

import FormInput from "@/components/clients/form/FormInput";
import ClientFormSectionHeader from "@/components/clients/form/ClientFormSectionHeader";
import { isCostaRicaCountry } from "@/lib/config/country-features";
import type { CountryPreset } from "@/lib/settings/countryPresets";

type LocationOption =
  | string
  | {
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

function getLocationOptionName(option: LocationOption) {
  if (typeof option === "string") {
    return option;
  }

  return option.nombre;
}

export default function ClientLocationSection({
  isOpen,
  onToggle,
  countryCode,
  countryPreset,
  countryOptions,
  adminLevel1,
  adminLevel2,
  adminLevel3,
  addressLine,
  provinciaOptions,
  cantonOptions,
  distritoOptions,
  handleCountryChange,
  handleProvinceChange,
  handleCantonChange,
  setAdminLevel1,
  setAdminLevel2,
  setAdminLevel3,
  setAddressLine,
  selectClass,
  inputClass,
}: ClientLocationSectionProps) {
  const isCostaRica = isCostaRicaCountry(countryCode);
  const adminLevel3Label =
    countryPreset.adminLevel3Label ?? "Nivel administrativo 3";

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <ClientFormSectionHeader
        icon="📍"
        title="Ubicación"
        description="Define el país, zona administrativa y dirección principal del cliente."
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                País
              </label>

              <select
                value={countryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className={selectClass}
              >
                {countryOptions.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>

              <p className="mt-1 text-xs text-slate-500">
                El país define los campos administrativos, formato de contacto y
                moneda sugerida para el cliente.
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

                    {cantonOptions.map((canton) => {
                      const cantonName = getLocationOptionName(canton);

                      return (
                        <option key={cantonName} value={cantonName}>
                          {cantonName}
                        </option>
                      );
                    })}
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

                    {distritoOptions.map((distrito) => {
                      const distritoName = getLocationOptionName(distrito);

                      return (
                        <option key={distritoName} value={distritoName}>
                          {distritoName}
                        </option>
                      );
                    })}
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
                  placeholder={`Ingrese ${countryPreset.adminLevel1Label.toLowerCase()}`}
                />

                <FormInput
                  label={countryPreset.adminLevel2Label}
                  value={adminLevel2}
                  onChange={setAdminLevel2}
                  inputClass={inputClass}
                  placeholder={`Ingrese ${countryPreset.adminLevel2Label.toLowerCase()}`}
                />

                <FormInput
                  label={adminLevel3Label}
                  value={adminLevel3}
                  onChange={setAdminLevel3}
                  inputClass={inputClass}
                  placeholder={`Ingrese ${adminLevel3Label.toLowerCase()}`}
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
        </div>
      )}
    </section>
  );
}
