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
  return (
    <>
      <div className="relative md:col-span-2">
        <label className="text-sm font-medium">Cliente *</label>
        <input
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          placeholder="Buscar por nombre o teléfono"
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />

        {loadingClients && !selectedClient && clientSearch.trim() && (
          <div className="mt-1 rounded-lg border bg-white p-2 text-sm text-gray-500">
            Buscando clientes...
          </div>
        )}

        {!loadingClients &&
          clients.length > 0 &&
          !selectedClient &&
          clientSearch.trim() && (
            <div className="mt-1 max-h-56 overflow-y-auto rounded-lg border bg-white shadow-sm">
              {clients.map((client) => (
                <button
                  key={client.client_id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-gray-50 last:border-b-0"
                >
                  <span className="font-medium">
                    {getClientDisplayName(client)}
                  </span>
                  <span className="text-gray-500">
                    {" "}
                    - {client.phone_primary || "Sin teléfono"}
                  </span>
                </button>
              ))}
            </div>
          )}

        {selectedClient && (
          <p className="mt-1 text-sm text-green-600">
            Cliente seleccionado: {getClientDisplayName(selectedClient)}
            {selectedClient.phone_primary
              ? ` - ${selectedClient.phone_primary}`
              : ""}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-7 md:col-span-2">
        <input
          id="use-client-address"
          type="checkbox"
          checked={useClientAddress}
          onChange={(e) => handleToggleUseClientAddress(e.target.checked)}
          disabled={!selectedClient}
        />
        <label htmlFor="use-client-address" className="text-sm">
          Usar dirección del cliente
        </label>
      </div>
    </>
  );
}
