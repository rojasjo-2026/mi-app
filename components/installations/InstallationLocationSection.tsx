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
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

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

  const firstLevelLabel = usesLocationCatalog
    ? "Provincia"
    : adminLevel1Label || "Nivel administrativo 1";

  const secondLevelLabel = usesLocationCatalog
    ? "Cantón"
    : adminLevel2Label || "Nivel administrativo 2";

  const thirdLevelLabel = usesLocationCatalog
    ? "Distrito"
    : adminLevel3Label || "Nivel administrativo 3";

  const firstLevelPlaceholder = `Seleccione ${firstLevelLabel.toLowerCase()}`;

  const secondLevelPlaceholder = adminLevel1
    ? `Seleccione ${secondLevelLabel.toLowerCase()}`
    : `Primero seleccione ${firstLevelLabel.toLowerCase()}`;

  const thirdLevelPlaceholder =
    adminLevel1 && adminLevel2
      ? `Seleccione ${thirdLevelLabel.toLowerCase()}`
      : `Primero seleccione ${secondLevelLabel.toLowerCase()}`;

  const safeAdminLevel1 = provinciaOptions.includes(adminLevel1)
    ? adminLevel1
    : "";

  const safeAdminLevel2 = cantonOptions.some(
    (canton) => canton.nombre === adminLevel2,
  )
    ? adminLevel2
    : "";

  const safeAdminLevel3 = distritoOptions.some(
    (distrito) => getDistrictName(distrito) === adminLevel3,
  )
    ? adminLevel3
    : "";

  return (
    <div className="space-y-4">
      {isLocked ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-700">
          Se está usando la dirección registrada del cliente como punto de
          partida. Podés usar el localizador para obtener coordenadas sin
          modificar esta dirección.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {firstLevelLabel}
          </label>

          {usesLocationCatalog ? (
            <select
              value={safeAdminLevel1}
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={isLocked}
              className={inputClassName}
            >
              <option value="" disabled>
                {firstLevelPlaceholder}
              </option>

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
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {secondLevelLabel}
          </label>

          {usesLocationCatalog ? (
            <select
              value={safeAdminLevel2}
              onChange={(e) => handleCantonChange(e.target.value)}
              disabled={!adminLevel1 || isLocked}
              className={inputClassName}
            >
              <option value="" disabled>
                {secondLevelPlaceholder}
              </option>

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

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {thirdLevelLabel}
          </label>

          {usesLocationCatalog ? (
            <select
              value={safeAdminLevel3}
              onChange={(e) => setAdminLevel3(e.target.value)}
              disabled={!adminLevel1 || !adminLevel2 || isLocked}
              className={inputClassName}
            >
              <option value="" disabled>
                {thirdLevelPlaceholder}
              </option>

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
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Usá la dirección donde se realizará el trabajo, no necesariamente la
            dirección administrativa del cliente.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
