"use client";

type Canton = {
  nombre: string;
};

type District = {
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
};

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

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
}: Props) {
  const isLocked = useClientAddress && hasSelectedClient;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            Dirección de la instalación
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Define la provincia, cantón, distrito y la referencia exacta del
            lugar.
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
            Provincia
          </label>
          <select
            value={adminLevel1}
            onChange={(e) => handleProvinceChange(e.target.value)}
            disabled={isLocked}
            className={inputClassName}
          >
            <option value="">Seleccione la provincia</option>
            {provinciaOptions.map((provincia) => (
              <option key={provincia} value={provincia}>
                {provincia}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Cantón
          </label>
          <select
            value={adminLevel2}
            onChange={(e) => handleCantonChange(e.target.value)}
            disabled={!adminLevel1 || isLocked}
            className={inputClassName}
          >
            <option value="">Seleccione el cantón</option>
            {cantonOptions.map((canton) => (
              <option key={canton.nombre} value={canton.nombre}>
                {canton.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Distrito
          </label>
          <select
            value={adminLevel3}
            onChange={(e) => setAdminLevel3(e.target.value)}
            disabled={!adminLevel1 || !adminLevel2 || isLocked}
            className={inputClassName}
          >
            <option value="">Seleccione el distrito</option>
            {distritoOptions.map((distrito) => (
              <option key={distrito.nombre} value={distrito.nombre}>
                {distrito.nombre}
              </option>
            ))}
          </select>
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
