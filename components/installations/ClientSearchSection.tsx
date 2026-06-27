"use client";

type Client = {
  client_id: string;
  first_name: string;
  last_name_1: string;
  last_name_2?: string | null;
  phone_primary?: string | null;
};

type Props = {
  clientSearch: string;
  setClientSearch: (value: string) => void;
  clients: Client[];
  selectedClient: Client | null;
  loadingClients: boolean;
  handleSelectClient: (client: Client) => void;
  useClientAddress: boolean;
  handleToggleUseClientAddress: (checked: boolean) => void;
};

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

function getClientDisplayName(client: Client) {
  return [client.first_name, client.last_name_1, client.last_name_2]
    .filter(Boolean)
    .join(" ");
}

export default function ClientSearchSection({
  clientSearch,
  setClientSearch,
  clients,
  selectedClient,
  loadingClients,
  handleSelectClient,
  useClientAddress,
  handleToggleUseClientAddress,
}: Props) {
  const hasSearchText = clientSearch.trim() !== "";
  const shouldShowResults =
    !loadingClients && clients.length > 0 && !selectedClient && hasSearchText;

  return (
    <>
      <div className="relative md:col-span-2">
        <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Cliente *
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Busca clientes activos según el país configurado.
            </p>
          </div>

          {selectedClient && (
            <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Seleccionado
            </span>
          )}
        </div>

        <input
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          placeholder="Buscar por nombre o teléfono"
          className={inputClassName}
        />

        {loadingClients && !selectedClient && hasSearchText && (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            Buscando clientes...
          </div>
        )}

        {shouldShowResults && (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {clients.map((client) => (
              <button
                key={client.client_id}
                type="button"
                onClick={() => handleSelectClient(client)}
                className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50 last:border-b-0"
              >
                <span className="block font-semibold text-slate-800">
                  {getClientDisplayName(client)}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {client.phone_primary || "Sin teléfono registrado"}
                </span>
              </button>
            ))}
          </div>
        )}

        {!loadingClients &&
          !selectedClient &&
          hasSearchText &&
          clients.length === 0 && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
              No se encontraron clientes activos para la búsqueda.
            </div>
          )}

        {selectedClient && (
          <div className="mt-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span className="font-semibold">Cliente seleccionado:</span>{" "}
            {getClientDisplayName(selectedClient)}
            {selectedClient.phone_primary
              ? ` · ${selectedClient.phone_primary}`
              : ""}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 md:col-span-2">
        <input
          id="use-client-address"
          type="checkbox"
          checked={useClientAddress}
          onChange={(e) => handleToggleUseClientAddress(e.target.checked)}
          disabled={!selectedClient}
          className="mt-1 h-4 w-4 rounded border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div>
          <label
            htmlFor="use-client-address"
            className="text-sm font-semibold text-slate-700"
          >
            Usar dirección del cliente
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Esta opción copia la dirección registrada del cliente y bloquea los
            campos de ubicación para evitar cambios accidentales.
          </p>
        </div>
      </div>
    </>
  );
}
