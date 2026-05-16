import Card from "./Card";
import InfoGrid from "./InfoGrid";
import InfoRow from "./InfoRow";

type InstallationMainInfoSectionProps = {
  installationDate: string;
  serviceTypeName: string;
  statusLabel: string;
  estimatedAmount: string;
  description: string;
};

export default function InstallationMainInfoSection({
  installationDate,
  serviceTypeName,
  statusLabel,
  estimatedAmount,
  description,
}: InstallationMainInfoSectionProps) {
  return (
    <Card title="📋 Información principal">
      <InfoGrid>
        <InfoRow label="Fecha de instalación" value={installationDate} />
        <InfoRow label="Tipo de servicio" value={serviceTypeName} />
        <InfoRow label="Estado" value={statusLabel} />
        <InfoRow label="Monto estimado" value={estimatedAmount} />
      </InfoGrid>

      <div className="pt-1">
        <InfoRow label="Descripción" value={description} />
      </div>
    </Card>
  );
}
