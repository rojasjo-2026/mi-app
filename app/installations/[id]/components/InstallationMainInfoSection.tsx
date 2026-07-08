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
  warrantyMonths?: string;
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
  warrantyMonths,
}: InstallationMainInfoSectionProps) {
  const hasCommercialInfo =
    costAmount || finalAmount || billingStatusLabel || billingNotes;

  return (
    <Card title="Información principal">
      <InfoGrid>
        <InfoRow label="Fecha de instalación" value={installationDate} />
        <InfoRow label="Tipo de servicio" value={serviceTypeName} />
        <InfoRow label="Estado" value={statusLabel} />
        <InfoRow label="Monto estimado" value={estimatedAmount} />

        {warrantyMonths ? (
          <InfoRow label="Garantía" value={`${warrantyMonths} meses`} />
        ) : null}
      </InfoGrid>

      <div className="pt-1">
        <InfoRow label="Descripción" value={description} />
      </div>

      {hasCommercialInfo ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-950">
              Información comercial
            </h3>

            <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
              Finanzas
            </span>
          </div>

          <InfoGrid>
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
            <div className="mt-3">
              <InfoRow label="Notas de facturación" value={billingNotes} />
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
