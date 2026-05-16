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
    <Card title="👤 Cliente">
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
        <div className="flex flex-wrap gap-3 pt-4">
          <Link
            href={`/clients/${clientId}`}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ver cliente
          </Link>

          <Link
            href={`/clients/${clientId}/edit`}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Editar cliente
          </Link>
        </div>
      ) : (
        <p className="pt-4 text-sm text-slate-500">
          No hay un cliente asociado para navegar.
        </p>
      )}
    </Card>
  );
}
