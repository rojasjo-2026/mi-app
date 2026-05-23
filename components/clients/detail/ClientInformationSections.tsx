"use client";

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
  getComplianceProfileLabel,
  getIdentificationTypeLabel,
  getPaymentTermLabel,
} from "@/lib/clients/clientDetail.utils";
import { getClientStatusLabel } from "@/lib/clients/clientStatus";
import {
  COUNTRY_PRESETS,
  getCountryPreset,
  type CountryPreset,
} from "@/lib/settings/countryPresets";
import { CollapsibleCard } from "@/components/clients/detail/CollapsibleCard";
import { InfoRow } from "@/components/clients/detail/InfoRow";

type ClientInformationSectionsProps = {
  client: ClientDetail;
  openSections: Record<DetailSectionKey, boolean>;
  onToggle: (section: DetailSectionKey) => void;
};

const DEFAULT_COUNTRY_CODE = "CR";

const fallbackCountryPreset =
  getCountryPreset(DEFAULT_COUNTRY_CODE) ?? Object.values(COUNTRY_PRESETS)[0];

function getClientDisplayName(client: ClientDetail) {
  return client.display_name || getFullName(client);
}

function getClientCountryPreset(client: ClientDetail): CountryPreset {
  return (
    getCountryPreset(client.country_code ?? client.identification_country) ??
    fallbackCountryPreset
  );
}

export function ClientInformationSections({
  client,
  openSections,
  onToggle,
}: ClientInformationSectionsProps) {
  const countryPreset = getClientCountryPreset(client);
  const currency = client.preferred_currency || countryPreset.primaryCurrency;
  const locale = countryPreset.locale;
  const taxLabel = countryPreset.taxLabel || "IVA";

  return (
    <>
      <CollapsibleCard
        title="Información principal"
        isOpen={openSections.main}
        onToggle={() => onToggle("main")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            label="Tipo de cliente"
            value={getClientTypeLabel(client.client_type)}
          />
          <InfoRow
            label="Nombre visible"
            value={client.display_name || getClientDisplayName(client)}
          />
          <InfoRow label="Nombre" value={client.first_name || "-"} />
          <InfoRow label="Primer apellido" value={client.last_name_1 || "-"} />
          <InfoRow label="Segundo apellido" value={client.last_name_2 || "-"} />
          <InfoRow
            label="Estado"
            value={getClientStatusLabel(client.client_status)}
          />
          <InfoRow label="Teléfono principal" value={client.phone_primary} />
          <InfoRow
            label="Teléfono secundario"
            value={client.phone_secondary || "-"}
          />
          <InfoRow label="Email" value={client.email || "-"} />
          <InfoRow
            label="WhatsApp"
            value={formatYesNo(client.whatsapp_opt_in)}
          />
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Identificación y cumplimiento"
        isOpen={openSections.identification}
        onToggle={() => onToggle("identification")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            label="País operativo"
            value={`${countryPreset.countryName} (${countryPreset.countryCode})`}
          />
          <InfoRow
            label="Perfil de validación"
            value={getComplianceProfileLabel(client.compliance_profile)}
          />
          <InfoRow
            label="País de identificación"
            value={client.identification_country || countryPreset.countryCode}
          />
          <InfoRow
            label="Tipo de identificación"
            value={getIdentificationTypeLabel(client.identification_type)}
          />
          <InfoRow
            label="Número de identificación"
            value={client.identification_number || client.tax_id || "-"}
          />
          <InfoRow
            label="Identificación tributaria"
            value={client.tax_id || client.identification_number || "-"}
          />
          <InfoRow
            label={`Exento de ${taxLabel}`}
            value={formatYesNo(client.tax_exempt)}
          />
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Datos empresariales"
        isOpen={openSections.business}
        onToggle={() => onToggle("business")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <CollapsibleCard
        title="Ubicación"
        isOpen={openSections.location}
        onToggle={() => onToggle("location")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            label="País operativo"
            value={`${countryPreset.countryName} (${countryPreset.countryCode})`}
          />
          <InfoRow
            label={countryPreset.adminLevel1Label}
            value={client.admin_level_1 || "-"}
          />
          <InfoRow
            label={countryPreset.adminLevel2Label}
            value={client.admin_level_2 || "-"}
          />
          <InfoRow
            label={countryPreset.adminLevel3Label ?? "Nivel administrativo 3"}
            value={client.admin_level_3 || "-"}
          />

          <div className="sm:col-span-2">
            <InfoRow label="Dirección" value={client.address_line || "-"} />
          </div>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Configuración financiera"
        isOpen={openSections.finance}
        onToggle={() => onToggle("finance")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            label="Tipo de pago"
            value={getPaymentTermLabel(client.default_payment_term)}
          />
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
          <InfoRow label="Moneda preferida" value={currency} />
          <InfoRow
            label={`Exento de ${taxLabel}`}
            value={formatYesNo(client.tax_exempt)}
          />
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Datos de facturación"
        isOpen={openSections.billing}
        onToggle={() => onToggle("billing")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow
            label="Usa datos del cliente"
            value={formatYesNo(client.billing_same_as_client)}
          />
          <InfoRow
            label="Nombre de facturación"
            value={client.billing_name || "-"}
          />
          <InfoRow
            label="Email de facturación"
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
      </CollapsibleCard>
    </>
  );
}
