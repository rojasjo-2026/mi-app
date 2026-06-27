"use client";

import FormInput from "@/components/clients/form/FormInput";
import ClientFormSectionHeader from "@/components/clients/form/ClientFormSectionHeader";

type IdentificationOption = {
  value: string;
  label: string;
};

type ClientBasicInfoSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  clientType: "PERSON" | "COMPANY" | "OTHER";
  complianceProfile: "GLOBAL" | "COSTA_RICA";
  identificationType: string;
  taxId: string;
  firstName: string;
  lastName1: string;
  lastName2: string;
  displayName: string;
  legalName: string;
  companyName: string;
  commercialName: string;
  mainContactName: string;
  identificationOptions: IdentificationOption[];
  inputClass: string;
  selectClass: string;
  handleClientTypeChange: (value: "PERSON" | "COMPANY" | "OTHER") => void;
  handleComplianceProfileChange: (value: "GLOBAL" | "COSTA_RICA") => void;
  setFirstName: (value: string) => void;
  setLastName1: (value: string) => void;
  setLastName2: (value: string) => void;
  setDisplayName: (value: string) => void;
  setLegalName: (value: string) => void;
  setCompanyName: (value: string) => void;
  setCommercialName: (value: string) => void;
  setMainContactName: (value: string) => void;
  setIdentificationType: (value: string) => void;
  setTaxId: (value: string) => void;
  getIdentificationHelpText: (identificationType: string) => string;
};

export default function ClientBasicInfoSection({
  isOpen,
  onToggle,
  clientType,
  complianceProfile,
  identificationType,
  taxId,
  firstName,
  lastName1,
  lastName2,
  displayName,
  legalName,
  companyName,
  commercialName,
  mainContactName,
  identificationOptions,
  inputClass,
  selectClass,
  handleClientTypeChange,
  setFirstName,
  setLastName1,
  setLastName2,
  setDisplayName,
  setLegalName,
  setCompanyName,
  setCommercialName,
  setMainContactName,
  setIdentificationType,
  setTaxId,
  getIdentificationHelpText,
}: ClientBasicInfoSectionProps) {
  const profileLabel =
    complianceProfile === "COSTA_RICA" ? "Costa Rica" : "Global";

  const identificationPlaceholder =
    complianceProfile === "COSTA_RICA"
      ? "Sin guiones ni espacios"
      : "Número de identificación fiscal o legal";

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <ClientFormSectionHeader
        icon="👤"
        title="Información del cliente"
        description="Define el tipo de cliente, su nombre legal o comercial y la identificación principal."
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {isOpen && (
        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Tipo de cliente *
              </label>

              <select
                value={clientType}
                onChange={(event) =>
                  handleClientTypeChange(
                    event.target.value as "PERSON" | "COMPANY" | "OTHER",
                  )
                }
                className={selectClass}
              >
                <option value="PERSON">Persona física</option>
                <option value="COMPANY">Empresa / Persona jurídica</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm">
                  🛡️
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Perfil de validación aplicado
                  </p>

                  <p className="mt-1 text-sm font-semibold text-blue-700">
                    {profileLabel}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Este perfil se aplica automáticamente según el país
                    seleccionado para el cliente.
                  </p>
                </div>
              </div>
            </div>

            {clientType === "PERSON" && (
              <>
                <FormInput
                  label="Nombre *"
                  value={firstName}
                  onChange={setFirstName}
                  required
                  inputClass={inputClass}
                />

                <FormInput
                  label="Primer apellido *"
                  value={lastName1}
                  onChange={setLastName1}
                  required
                  inputClass={inputClass}
                />

                <FormInput
                  label="Segundo apellido"
                  value={lastName2}
                  onChange={setLastName2}
                  inputClass={inputClass}
                />
              </>
            )}

            {clientType === "COMPANY" && (
              <>
                <FormInput
                  label="Nombre de la empresa / razón social *"
                  value={companyName}
                  onChange={setCompanyName}
                  required
                  inputClass={inputClass}
                />

                <FormInput
                  label="Nombre comercial"
                  value={commercialName}
                  onChange={setCommercialName}
                  inputClass={inputClass}
                />

                <FormInput
                  label="Contacto principal"
                  value={mainContactName}
                  onChange={setMainContactName}
                  inputClass={inputClass}
                  placeholder="Persona encargada o contacto operativo"
                />
              </>
            )}

            {clientType === "OTHER" && (
              <>
                <FormInput
                  label="Nombre del cliente *"
                  value={displayName}
                  onChange={setDisplayName}
                  required
                  inputClass={inputClass}
                />

                <FormInput
                  label="Nombre legal"
                  value={legalName}
                  onChange={setLegalName}
                  inputClass={inputClass}
                />

                <FormInput
                  label="Contacto principal"
                  value={mainContactName}
                  onChange={setMainContactName}
                  inputClass={inputClass}
                  placeholder="Persona encargada o contacto operativo"
                />
              </>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Tipo de identificación *
              </label>

              <select
                value={identificationType}
                onChange={(event) => setIdentificationType(event.target.value)}
                className={selectClass}
                required
              >
                {identificationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FormInput
                label="Identificación fiscal / legal *"
                value={taxId}
                onChange={setTaxId}
                required
                inputClass={inputClass}
                placeholder={identificationPlaceholder}
              />

              <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                {getIdentificationHelpText(identificationType)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
