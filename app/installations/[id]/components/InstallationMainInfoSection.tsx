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
    <Card title="📋 Información principal">
      <InfoGrid>
        <InfoRow label="Fecha de instalación" value={installationDate} />
        <InfoRow label="Tipo de servicio" value={serviceTypeName} />
        <InfoRow label="Estado" value={statusLabel} />
        <InfoRow label="Monto estimado" value={estimatedAmount} />

        {warrantyMonths && (
          <InfoRow label="Garantía" value={`${warrantyMonths} meses`} />
        )}
      </InfoGrid>

      <div className="pt-1">
        <InfoRow label="Descripción" value={description} />
      </div>

      {hasCommercialInfo && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Información comercial
            </h3>

            <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Finanzas
            </span>
          </div>

          <InfoGrid>
            {costAmount && <InfoRow label="Costo interno" value={costAmount} />}

            {finalAmount && <InfoRow label="Monto final" value={finalAmount} />}

            {billingStatusLabel && (
              <InfoRow
                label="Estado de facturación"
                value={billingStatusLabel}
              />
            )}
          </InfoGrid>

          {billingNotes && (
            <div className="mt-3">
              <InfoRow label="Notas de facturación" value={billingNotes} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
