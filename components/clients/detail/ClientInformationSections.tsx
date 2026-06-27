"use client";

import {
  BadgeCheck,
  Building2,
  CreditCard,
  MapPin,
  ReceiptText,
  UserRound,
} from "lucide-react";
import type {
  ClientDetail,
  DetailSectionKey,
} from "@/lib/clients/clientDetail.types";
import { getFullName } from "@/lib/utils/getFullName";
import {
  formatCurrency,
  formatOptionalNumber,
  formatPercentage,
  formatYesNo,
  getClientTypeLabel,
  getIdentificationTypeLabel,
  getPaymentTermLabel,
} from "@/lib/clients/clientDetail.utils";
import { getBusinessCountryPreset } from "@/lib/settings/appSettingsUtils";
import { CollapsibleCard } from "@/components/clients/detail/CollapsibleCard";
import { InfoRow } from "@/components/clients/detail/InfoRow";

type ClientInformationSectionsProps = {
  client: ClientDetail;
  openSections: Record<DetailSectionKey, boolean>;
  onToggle: (section: DetailSectionKey) => void;
};

function getClientDisplayName(client: ClientDetail) {
  return (
    client.display_name?.trim() ||
    client.commercial_name?.trim() ||
    client.company_name?.trim() ||
    getFullName(client)
  );
}

function hasBusinessData(client: ClientDetail) {
  return Boolean(
    client.legal_name ||
    client.company_name ||
    client.commercial_name ||
    client.main_contact_name,
  );
}

function getIdentificationValue(client: ClientDetail) {
  return client.identification_number || client.tax_id || "-";
}

export function ClientInformationSections({
  client,
  openSections,
  onToggle,
}: ClientInformationSectionsProps) {
  const countryPreset = getBusinessCountryPreset(
    client.country_code ?? client.identification_country,
  );

  const currency = client.preferred_currency || countryPreset.primaryCurrency;
  const locale = countryPreset.locale;
  const taxLabel = countryPreset.taxLabel || "Impuesto";
  const adminLevel3Label =
    countryPreset.adminLevel3Label || "Nivel administrativo 3";

  const businessDataAvailable = hasBusinessData(client);
  const billingSameAsClient = Boolean(client.billing_same_as_client);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <CollapsibleCard
          title="Información principal"
          description="Datos de contacto y clasificación del cliente."
          icon={<UserRound className="h-5 w-5" />}
          isOpen={openSections.main}
          onToggle={() => onToggle("main")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow
              label="Tipo de cliente"
              value={getClientTypeLabel(client.client_type)}
            />

            <InfoRow
              label="Nombre completo"
              value={getClientDisplayName(client)}
            />

            <InfoRow label="Teléfono principal" value={client.phone_primary} />

            <InfoRow
              label="Teléfono secundario"
              value={client.phone_secondary || "-"}
            />

            <div className="sm:col-span-2">
              <InfoRow label="Correo electrónico" value={client.email || "-"} />
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Ubicación"
          description="Dirección operativa principal del cliente."
          icon={<MapPin className="h-5 w-5" />}
          isOpen={openSections.location}
          onToggle={() => onToggle("location")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow label="País" value={countryPreset.countryName} />

            <InfoRow
              label={countryPreset.adminLevel1Label}
              value={client.admin_level_1 || "-"}
            />

            <InfoRow
              label={countryPreset.adminLevel2Label}
              value={client.admin_level_2 || "-"}
            />

            <InfoRow
              label={adminLevel3Label}
              value={client.admin_level_3 || "-"}
            />

            <div className="sm:col-span-2">
              <InfoRow label="Dirección" value={client.address_line || "-"} />
            </div>
          </div>
        </CollapsibleCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CollapsibleCard
          title="Identificación"
          description="Documento principal del cliente."
          icon={<BadgeCheck className="h-5 w-5" />}
          isOpen={openSections.identification}
          onToggle={() => onToggle("identification")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow
              label="País de identificación"
              value={
                client.identification_country || client.country_code || "-"
              }
            />

            <InfoRow
              label="Tipo de identificación"
              value={getIdentificationTypeLabel(client.identification_type)}
            />

            <div className="sm:col-span-2">
              <InfoRow
                label="Número de identificación"
                value={getIdentificationValue(client)}
              />
            </div>
          </div>
        </CollapsibleCard>

        {businessDataAvailable ? (
          <CollapsibleCard
            title="Datos empresariales"
            description="Información comercial adicional."
            icon={<Building2 className="h-5 w-5" />}
            isOpen={openSections.business}
            onToggle={() => onToggle("business")}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow
                label="Razón social / nombre legal"
                value={client.legal_name || "-"}
              />

              <InfoRow
                label="Nombre de empresa"
                value={client.company_name || "-"}
              />

              <InfoRow
                label="Nombre comercial"
                value={client.commercial_name || "-"}
              />

              <InfoRow
                label="Contacto principal"
                value={client.main_contact_name || "-"}
              />
            </div>
          </CollapsibleCard>
        ) : null}

        <CollapsibleCard
          title="Configuración financiera"
          description="Condiciones comerciales específicas del cliente."
          icon={<CreditCard className="h-5 w-5" />}
          isOpen={openSections.finance}
          onToggle={() => onToggle("finance")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow
              label="Tipo de pago"
              value={getPaymentTermLabel(client.default_payment_term)}
            />

            <InfoRow label="Moneda preferida" value={currency} />

            <InfoRow
              label="Días de crédito"
              value={formatOptionalNumber(client.default_credit_days)}
            />

            <InfoRow
              label="Límite de crédito"
              value={formatCurrency(client.credit_limit, currency, locale)}
            />

            <InfoRow
              label="Descuento por defecto"
              value={formatPercentage(client.default_discount_rate)}
            />

            <InfoRow
              label={`Exento de ${taxLabel}`}
              value={formatYesNo(client.tax_exempt)}
            />
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          title="Datos de facturación"
          description="Datos usados para generar facturas."
          icon={<ReceiptText className="h-5 w-5" />}
          isOpen={openSections.billing}
          onToggle={() => onToggle("billing")}
        >
          {billingSameAsClient ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-4">
              <p className="text-sm font-bold text-slate-900">
                Usa la información principal del cliente
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Las facturas utilizarán el nombre, teléfono, correo y dirección
                principal registrados en el cliente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow
                label="Nombre de facturación"
                value={client.billing_name || "-"}
              />

              <InfoRow
                label="Correo de facturación"
                value={client.billing_email || "-"}
              />

              <InfoRow
                label="Teléfono de facturación"
                value={client.billing_phone || "-"}
              />

              <div className="sm:col-span-2">
                <InfoRow
                  label="Dirección de facturación"
                  value={client.billing_address || "-"}
                />
              </div>
            </div>
          )}
        </CollapsibleCard>
      </div>
    </div>
  );
}
