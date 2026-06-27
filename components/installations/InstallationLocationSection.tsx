"use client";

type Canton = {
  nombre: string;
};

type District =
  | string
  | {
      nombre: string;
    };

type Props = {
  useClientAddress: boolean;
  hasSelectedClient: boolean;
  provinciaOptions: string[];
  cantonOptions: Canton[];
  distritoOptions: District[];
  adminLevel1: string;
  adminLevel2: string;
  adminLevel3: string;
  addressLine: string;
  referencePoint: string;
  addressRef: React.RefObject<HTMLInputElement | null>;
  handleProvinceChange: (value: string) => void;
  handleCantonChange: (value: string) => void;
  setAdminLevel3: (value: string) => void;
  setAddressLine: (value: string) => void;
  setReferencePoint: (value: string) => void;
  adminLevel1Label?: string;
  adminLevel2Label?: string;
  adminLevel3Label?: string | null;
};

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

function getDistrictName(district: District) {
  if (typeof district === "string") {
    return district;
  }

  return district.nombre;
}

export default function InstallationLocationSection({
  useClientAddress,
  hasSelectedClient,
  provinciaOptions,
  cantonOptions,
  distritoOptions,
  adminLevel1,
  adminLevel2,
  adminLevel3,
  addressLine,
  referencePoint,
  addressRef,
  handleProvinceChange,
  handleCantonChange,
  setAdminLevel3,
  setAddressLine,
  setReferencePoint,
  adminLevel1Label,
  adminLevel2Label,
  adminLevel3Label,
}: Props) {
  const isLocked = useClientAddress && hasSelectedClient;
  const usesLocationCatalog = provinciaOptions.length > 0;

  const firstLevelLabel =
    adminLevel1Label || (usesLocationCatalog ? "Provincia" : "Nivel administrativo 1");

  const secondLevelLabel =
    adminLevel2Label || (usesLocationCatalog ? "Cantón" : "Nivel administrativo 2");

  const thirdLevelLabel =
    adminLevel3Label || (usesLocationCatalog ? "Distrito" : "Nivel administrativo 3");

  const locationDescription = usesLocationCatalog
    ? `Define ${firstLevelLabel.toLowerCase()}, ${secondLevelLabel.toLowerCase()}, ${thirdLevelLabel.toLowerCase()} y la referencia exacta del lugar.`
    : "Define la ubicación administrativa, dirección y referencia exacta del lugar.";

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            Dirección de la instalación
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {locationDescription}
          </p>
        </div>

        <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
          Ubicación
        </span>
      </div>

      {isLocked && (
        <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Se está utilizando la dirección del cliente. Puede usar el localizador
          para obtener automáticamente las coordenadas sin modificar esta
          dirección.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {firstLevelLabel}
          </label>

          {usesLocationCatalog ? (
            <select
              value={adminLevel1}
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={isLocked}
              className={inputClassName}
            >
              <option value="">Seleccione {firstLevelLabel.toLowerCase()}</option>
              {provinciaOptions.map((provincia) => (
                <option key={provincia} value={provincia}>
                  {provincia}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={adminLevel1}
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={isLocked}
              className={inputClassName}
              placeholder={`Ingrese ${firstLevelLabel.toLowerCase()}`}
            />
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {secondLevelLabel}
          </label>

          {usesLocationCatalog ? (
            <select
              value={adminLevel2}
              onChange={(e) => handleCantonChange(e.target.value)}
              disabled={!adminLevel1 || isLocked}
              className={inputClassName}
            >
              <option value="">Seleccione {secondLevelLabel.toLowerCase()}</option>
              {cantonOptions.map((canton) => (
                <option key={canton.nombre} value={canton.nombre}>
                  {canton.nombre}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={adminLevel2}
              onChange={(e) => handleCantonChange(e.target.value)}
              disabled={isLocked}
              className={inputClassName}
              placeholder={`Ingrese ${secondLevelLabel.toLowerCase()}`}
            />
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {thirdLevelLabel}
          </label>

          {usesLocationCatalog ? (
            <select
              value={adminLevel3}
              onChange={(e) => setAdminLevel3(e.target.value)}
              disabled={!adminLevel1 || !adminLevel2 || isLocked}
              className={inputClassName}
            >
              <option value="">Seleccione {thirdLevelLabel.toLowerCase()}</option>
              {distritoOptions.map((distrito) => {
                const districtName = getDistrictName(distrito);

                return (
                  <option key={districtName} value={districtName}>
                    {districtName}
                  </option>
                );
              })}
            </select>
          ) : (
            <input
              value={adminLevel3}
              onChange={(e) => setAdminLevel3(e.target.value)}
              disabled={isLocked}
              className={inputClassName}
              placeholder={`Ingrese ${thirdLevelLabel.toLowerCase()}`}
            />
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Dirección
          </label>
          <input
            ref={addressRef}
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            disabled={isLocked}
            className={inputClassName}
            placeholder="Dirección exacta de la instalación"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Punto de referencia
          </label>
          <input
            value={referencePoint}
            onChange={(e) => setReferencePoint(e.target.value)}
            disabled={isLocked}
            className={inputClassName}
            placeholder="Ejemplo: 100 metros al sur de la iglesia"
          />
        </div>
      </div>
    </div>
  );
}
