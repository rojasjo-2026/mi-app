import Card from "./Card";
import InfoGrid from "./InfoGrid";
import InfoRow from "./InfoRow";

type InstallationMainInfoSectionProps = {
  installationDate: string;
  serviceTypeName: string;
  statusLabel: string;
  estimatedAmount: string;
  description: string;
  costAmount?: string;
  finalAmount?: string;
  billingStatusLabel?: string;
  billingNotes?: string;
};

export default function InstallationMainInfoSection({
  installationDate,
  serviceTypeName,
  statusLabel,
  estimatedAmount,
  description,
  costAmount,
  finalAmount,
  billingStatusLabel,
  billingNotes,
}: InstallationMainInfoSectionProps) {
  const hasCommercialInfo =
    estimatedAmount ||
    costAmount ||
    finalAmount ||
    billingStatusLabel ||
    billingNotes;

  return (
    <Card title="Información principal">
      <div className="space-y-6">
        <InfoGrid>
          <InfoRow label="Fecha de instalación" value={installationDate} />
          <InfoRow label="Tipo de servicio" value={serviceTypeName} />
          <InfoRow label="Estado" value={statusLabel} />
        </InfoGrid>

        <div className="max-w-4xl">
          <InfoRow label="Descripción" value={description} />
        </div>

        {hasCommercialInfo ? (
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                Información comercial
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Valores y estado de facturación asociados con esta instalación.
              </p>
            </div>

            <InfoGrid>
              <InfoRow label="Monto estimado" value={estimatedAmount} />

              {costAmount ? (
                <InfoRow label="Costo interno" value={costAmount} />
              ) : null}

              {finalAmount ? (
                <InfoRow label="Monto final" value={finalAmount} />
              ) : null}

              {billingStatusLabel ? (
                <InfoRow
                  label="Estado de facturación"
                  value={billingStatusLabel}
                />
              ) : null}
            </InfoGrid>

            {billingNotes ? (
              <div className="max-w-4xl">
                <InfoRow label="Notas de facturación" value={billingNotes} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
