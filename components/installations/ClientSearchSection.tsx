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
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

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
        <div className="mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Cliente *
            </label>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Buscá clientes activos según la configuración de la empresa.
            </p>
          </div>

          {selectedClient ? (
            <span className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              Seleccionado
            </span>
          ) : null}
        </div>

        <input
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          placeholder="Buscar por nombre o teléfono"
          className={inputClassName}
        />

        {loadingClients && !selectedClient && hasSearchText ? (
          <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
            Buscando clientes...
          </div>
        ) : null}

        {shouldShowResults ? (
          <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            {clients.map((client) => (
              <button
                key={client.client_id}
                type="button"
                onClick={() => handleSelectClient(client)}
                className="block w-full border-t border-slate-100 px-3 py-2.5 text-left text-sm transition first:border-t-0 hover:bg-slate-50"
              >
                <span className="block font-medium text-slate-900">
                  {getClientDisplayName(client)}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {client.phone_primary || "Sin teléfono registrado"}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {!loadingClients &&
        !selectedClient &&
        hasSearchText &&
        clients.length === 0 ? (
          <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
            No se encontraron clientes activos para la búsqueda.
          </div>
        ) : null}

        {selectedClient ? (
          <div className="mt-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            <span className="font-semibold">Cliente seleccionado:</span>{" "}
            {getClientDisplayName(selectedClient)}
            {selectedClient.phone_primary
              ? ` · ${selectedClient.phone_primary}`
              : ""}
          </div>
        ) : null}
      </div>

      <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 md:col-span-2">
        <input
          id="use-client-address"
          type="checkbox"
          checked={useClientAddress}
          onChange={(e) => handleToggleUseClientAddress(e.target.checked)}
          disabled={!selectedClient}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div>
          <label
            htmlFor="use-client-address"
            className="text-sm font-medium text-slate-700"
          >
            Usar dirección del cliente
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Copia la dirección registrada del cliente como punto de partida para
            esta instalación. Podés desactivar esta opción si el trabajo se
            realizará en otra ubicación.
          </p>
        </div>
      </div>
    </>
  );
}
