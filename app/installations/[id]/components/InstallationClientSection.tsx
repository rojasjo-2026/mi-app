import Link from "next/link";
import Card from "./Card";
import InfoGrid from "./InfoGrid";
import InfoRow from "./InfoRow";

type InstallationClientSectionProps = {
  clientId?: string | null;
  clientName: string;
  phonePrimary?: string | null;
  email?: string | null;
};

export default function InstallationClientSection({
  clientId,
  clientName,
  phonePrimary,
  email,
}: InstallationClientSectionProps) {
  return (
    <Card title="Cliente">
      <InfoGrid>
        <InfoRow label="Nombre" value={clientName || "-"} />
        <InfoRow label="Teléfono" value={phonePrimary || "-"} />
        <InfoRow label="Email" value={email || "-"} />
        <InfoRow
          label="Estado del vínculo"
          value={clientId ? "Asociado" : "-"}
        />
      </InfoGrid>

      {clientId ? (
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          <Link
            href={`/clients/${clientId}`}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Ver cliente
          </Link>

          <Link
            href={`/clients/${clientId}/edit`}
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Editar cliente
          </Link>
        </div>
      ) : (
        <p className="border-t border-slate-100 pt-5 text-sm leading-6 text-slate-500">
          No hay un cliente asociado para navegar.
        </p>
      )}
    </Card>
  );
}
