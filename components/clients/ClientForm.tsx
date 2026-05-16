"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { provincias } from "@/lib/data/costa-rica-locations";
import {
  CLIENT_STATUS_OPTIONS,
  normalizeClientStatus,
  type ClientStatus,
} from "@/lib/clients/clientStatus";
import {
  getDefaultIdentificationType,
  buildFullName,
  normalizeIdentificationValue,
  getIdentificationHelpText,
  validateIdentificationNumber,
  getReadableFieldName,
  getReadableValidationError,
} from "@/lib/clients/clientForm.utils";
import FormSection from "@/components/clients/form/FormSection";
import FormInput from "@/components/clients/form/FormInput";
import AlertMessage from "@/components/clients/form/AlertMessage";

type ClientType = "PERSON" | "COMPANY" | "OTHER";
type ClientComplianceProfile = "GLOBAL" | "COSTA_RICA";

type ClientFormData = {
  id?: string;
  client_id?: string;

  client_type?: ClientType | null;
  compliance_profile?: ClientComplianceProfile | null;
  display_name?: string | null;
  legal_name?: string | null;
  company_name?: string | null;
  commercial_name?: string | null;
  main_contact_name?: string | null;
  identification_country?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;

  first_name?: string | null;
  last_name_1?: string | null;
  last_name_2?: string | null;
  phone_primary?: string | null;
  phone_secondary?: string | null;
  email?: string | null;
  address_line?: string | null;
  admin_level_1?: string | null;
  admin_level_2?: string | null;
  admin_level_3?: string | null;
  client_status?: ClientStatus | string | null;
  whatsapp_opt_in?: boolean | null;
  default_payment_term?: "CASH" | "CREDIT" | null;
  default_credit_days?: number | string | null;
  default_discount_rate?: number | string | null;
  credit_limit?: number | string | null;
  billing_same_as_client?: boolean | null;
  billing_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: string | null;
  tax_id?: string | null;
  tax_exempt?: boolean | null;
  preferred_currency?: "CRC" | "USD" | null;
};

type ClientFormProps = {
  mode: "create" | "edit";
  initialData?: ClientFormData | null;
};

type SectionKey = "personal" | "contact" | "location" | "finance" | "billing";

const COSTA_RICA_IDENTIFICATION_OPTIONS = [
  { value: "CEDULA_FISICA", label: "Cédula física" },
  { value: "CEDULA_JURIDICA", label: "Cédula jurídica" },
  { value: "DIMEX", label: "DIMEX" },
  { value: "NITE", label: "NITE" },
  { value: "EXTRANJERO_NO_DOMICILIADO", label: "Extranjero no domiciliado" },
  { value: "NO_CONTRIBUYENTE", label: "No contribuyente" },
  { value: "OTHER", label: "Otro" },
];

const GLOBAL_IDENTIFICATION_OPTIONS = [
  { value: "NATIONAL_ID", label: "Documento nacional" },
  { value: "TAX_ID", label: "Documento fiscal" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "BUSINESS_REGISTRATION", label: "Registro empresarial" },
  { value: "OTHER", label: "Otro" },
];

export default function ClientForm({
  mode,
  initialData = null,
}: ClientFormProps) {
  const router = useRouter();

  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(
    {
      personal: true,
      contact: true,
      location: true,
      finance: false,
      billing: false,
    },
  );

  const [clientType, setClientType] = useState<ClientType>("PERSON");
  const [complianceProfile, setComplianceProfile] =
    useState<ClientComplianceProfile>("COSTA_RICA");

  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [commercialName, setCommercialName] = useState("");
  const [mainContactName, setMainContactName] = useState("");

  const [identificationType, setIdentificationType] = useState("CEDULA_FISICA");
  const [taxId, setTaxId] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName1, setLastName1] = useState("");
  const [lastName2, setLastName2] = useState("");

  const [phonePrimary, setPhonePrimary] = useState("");
  const [phoneSecondary, setPhoneSecondary] = useState("");
  const [email, setEmail] = useState("");

  const [addressLine, setAddressLine] = useState("");
  const [adminLevel1, setAdminLevel1] = useState("");
  const [adminLevel2, setAdminLevel2] = useState("");
  const [adminLevel3, setAdminLevel3] = useState("");

  const [clientStatus, setClientStatus] = useState<ClientStatus>("ACTIVE");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  const [paymentTerm, setPaymentTerm] = useState<"CASH" | "CREDIT">("CASH");
  const [creditDays, setCreditDays] = useState("");
  const [discountRate, setDiscountRate] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [taxExempt, setTaxExempt] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState<"CRC" | "USD">(
    "CRC",
  );

  const [billingSameAsClient, setBillingSameAsClient] = useState(true);
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const identificationOptions =
    complianceProfile === "COSTA_RICA"
      ? COSTA_RICA_IDENTIFICATION_OPTIONS
      : GLOBAL_IDENTIFICATION_OPTIONS;

  useEffect(() => {
    if (!initialData) return;

    const nextClientType = initialData.client_type ?? "PERSON";
    const nextComplianceProfile =
      initialData.compliance_profile ?? "COSTA_RICA";

    setClientType(nextClientType);
    setComplianceProfile(nextComplianceProfile);

    setDisplayName(initialData.display_name ?? "");
    setLegalName(initialData.legal_name ?? "");
    setCompanyName(initialData.company_name ?? "");
    setCommercialName(initialData.commercial_name ?? "");
    setMainContactName(initialData.main_contact_name ?? "");

    setIdentificationType(
      initialData.identification_type ??
        getDefaultIdentificationType(nextClientType, nextComplianceProfile),
    );

    setTaxId(initialData.identification_number ?? initialData.tax_id ?? "");

    setFirstName(initialData.first_name ?? "");
    setLastName1(initialData.last_name_1 ?? "");
    setLastName2(initialData.last_name_2 ?? "");

    setPhonePrimary(initialData.phone_primary ?? "");
    setPhoneSecondary(initialData.phone_secondary ?? "");
    setEmail(initialData.email ?? "");

    setAddressLine(initialData.address_line ?? "");
    setAdminLevel1(initialData.admin_level_1 ?? "");
    setAdminLevel2(initialData.admin_level_2 ?? "");
    setAdminLevel3(initialData.admin_level_3 ?? "");

    setClientStatus(
      normalizeClientStatus(initialData.client_status) ?? "ACTIVE",
    );
    setWhatsappOptIn(initialData.whatsapp_opt_in ?? true);

    setPaymentTerm(initialData.default_payment_term ?? "CASH");
    setCreditDays(
      initialData.default_credit_days !== null &&
        initialData.default_credit_days !== undefined
        ? String(initialData.default_credit_days)
        : "",
    );
    setDiscountRate(
      initialData.default_discount_rate !== null &&
        initialData.default_discount_rate !== undefined
        ? String(initialData.default_discount_rate)
        : "",
    );
    setCreditLimit(
      initialData.credit_limit !== null &&
        initialData.credit_limit !== undefined
        ? String(initialData.credit_limit)
        : "",
    );
    setTaxExempt(initialData.tax_exempt ?? false);
    setPreferredCurrency(initialData.preferred_currency ?? "CRC");

    setBillingSameAsClient(initialData.billing_same_as_client ?? true);
    setBillingName(initialData.billing_name ?? "");
    setBillingEmail(initialData.billing_email ?? "");
    setBillingPhone(initialData.billing_phone ?? "");
    setBillingAddress(initialData.billing_address ?? "");
  }, [initialData]);

  useEffect(() => {
    if (paymentTerm === "CASH") {
      setCreditDays("");
      setCreditLimit("");
    }
  }, [paymentTerm]);

  const provinciaOptions = useMemo(
    () => provincias.map((provincia) => provincia.nombre),
    [],
  );

  const cantonOptions = useMemo(() => {
    const provinciaSeleccionada = provincias.find(
      (provincia) => provincia.nombre === adminLevel1,
    );

    return provinciaSeleccionada?.cantones ?? [];
  }, [adminLevel1]);

  const distritoOptions = useMemo(() => {
    const cantonSeleccionado = cantonOptions.find(
      (canton) => canton.nombre === adminLevel2,
    );

    return cantonSeleccionado?.distritos ?? [];
  }, [adminLevel2, cantonOptions]);

  function toggleSection(section: SectionKey) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function handleClientTypeChange(value: ClientType) {
    setClientType(value);
    setIdentificationType(
      getDefaultIdentificationType(value, complianceProfile),
    );
  }

  function handleComplianceProfileChange(value: ClientComplianceProfile) {
    setComplianceProfile(value);
    setIdentificationType(getDefaultIdentificationType(clientType, value));
  }

  function handleProvinceChange(value: string) {
    setAdminLevel1(value);
    setAdminLevel2("");
    setAdminLevel3("");
  }

  function handleCantonChange(value: string) {
    setAdminLevel2(value);
    setAdminLevel3("");
  }

  function handleBack() {
    const clientId = initialData?.id ?? initialData?.client_id;

    if (mode === "edit" && clientId) {
      router.push(`/clients/${clientId}`);
      return;
    }

    router.push("/clients");
  }

  function resolveDisplayName() {
    if (clientType === "COMPANY") {
      return companyName || legalName || commercialName || "Empresa";
    }

    if (clientType === "OTHER") {
      return displayName || legalName || "Cliente";
    }

    return buildFullName(firstName, lastName1, lastName2);
  }

  function resolveBillingName() {
    return resolveDisplayName();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const identificationValidationError = validateIdentificationNumber(
        identificationType,
        taxId,
      );

      if (identificationValidationError) {
        throw new Error(identificationValidationError);
      }

      const clientId = initialData?.id ?? initialData?.client_id;

      const endpoint =
        mode === "create" ? "/api/clients" : `/api/clients/${clientId}`;

      const method = mode === "create" ? "POST" : "PUT";

      const resolvedDisplayName = resolveDisplayName();
      const normalizedTaxId = normalizeIdentificationValue(taxId);

      const resolvedFirstName =
        clientType === "PERSON" ? firstName : resolvedDisplayName;

      const resolvedLastName1 =
        clientType === "PERSON"
          ? lastName1
          : clientType === "COMPANY"
            ? "Empresa"
            : "Otro";

      const resolvedBillingName = billingSameAsClient
        ? resolveBillingName()
        : billingName;

      const payload = {
        client_type: clientType,
        compliance_profile: complianceProfile,

        display_name: resolvedDisplayName,
        legal_name:
          clientType === "COMPANY"
            ? legalName || companyName || resolvedDisplayName
            : clientType === "OTHER"
              ? legalName || displayName || resolvedDisplayName
              : resolvedDisplayName,

        company_name: clientType === "COMPANY" ? companyName : null,
        commercial_name:
          clientType === "COMPANY" ? commercialName || null : null,
        main_contact_name:
          clientType !== "PERSON" ? mainContactName || null : null,

        identification_country: "CR",
        identification_type: identificationType,
        identification_number: normalizedTaxId,
        tax_id: normalizedTaxId,

        first_name: resolvedFirstName,
        last_name_1: resolvedLastName1,
        last_name_2: clientType === "PERSON" && lastName2 ? lastName2 : null,

        phone_primary: phonePrimary,
        phone_secondary: phoneSecondary || null,
        email: email || null,

        address_line: addressLine || null,
        admin_level_1: adminLevel1 || null,
        admin_level_2: adminLevel2 || null,
        admin_level_3: adminLevel3 || null,

        client_status: mode === "create" ? "ACTIVE" : clientStatus,
        whatsapp_opt_in: whatsappOptIn,

        default_payment_term: paymentTerm,
        default_credit_days:
          paymentTerm === "CREDIT" && creditDays ? Number(creditDays) : null,
        default_discount_rate: discountRate ? Number(discountRate) : null,
        credit_limit:
          paymentTerm === "CREDIT" && creditLimit ? Number(creditLimit) : null,
        tax_exempt: taxExempt,
        preferred_currency: preferredCurrency,

        billing_same_as_client: billingSameAsClient,
        billing_name: billingSameAsClient
          ? resolvedBillingName
          : billingName || null,
        billing_email: billingSameAsClient
          ? email || null
          : billingEmail || null,
        billing_phone: billingSameAsClient
          ? phonePrimary || null
          : billingPhone || null,
        billing_address: billingSameAsClient
          ? addressLine || null
          : billingAddress || null,
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const validationDetails = Array.isArray(result.errors)
          ? result.errors
              .map((item: { field?: string; error?: string }) => {
                const readableField = getReadableFieldName(item.field);
                const readableError = getReadableValidationError(
                  item.error ?? "invalid",
                );

                return `${readableField}: ${readableError}`;
              })
              .join(", ")
          : "";

        throw new Error(
          validationDetails ||
            result.message ||
            (mode === "create"
              ? "No se pudo crear el cliente"
              : "No se pudo actualizar el cliente"),
        );
      }

      setMessage(
        mode === "create"
          ? "Cliente creado correctamente"
          : "Cliente actualizado correctamente",
      );

      setTimeout(() => {
        if (mode === "create") {
          router.push("/clients");
          return;
        }

        if (clientId) {
          router.push(`/clients/${clientId}`);
          return;
        }

        router.push("/clients");
      }, 800);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : mode === "create"
            ? "No se pudo crear el cliente"
            : "No se pudo actualizar el cliente",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

  const selectClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <main className="min-h-screen bg-slate-50/60 p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {mode === "create" ? "Nuevo cliente" : "Editar cliente"}
            </div>

            <h1 className="text-3xl font-bold text-slate-900">
              {mode === "create" ? "Crear cliente" : "Editar cliente"}
            </h1>

            <p className="text-sm text-slate-600">
              {mode === "create"
                ? "Registrar un nuevo cliente en el sistema"
                : "Actualizar información del cliente"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Volver
          </button>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSection
            title="Información del cliente"
            isOpen={openSections.personal}
            onToggle={() => toggleSection("personal")}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tipo de cliente *
                </label>
                <select
                  value={clientType}
                  onChange={(e) =>
                    handleClientTypeChange(e.target.value as ClientType)
                  }
                  className={selectClass}
                >
                  <option value="PERSON">Persona física</option>
                  <option value="COMPANY">Empresa / Persona jurídica</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Perfil de validación *
                </label>
                <select
                  value={complianceProfile}
                  onChange={(e) =>
                    handleComplianceProfileChange(
                      e.target.value as ClientComplianceProfile,
                    )
                  }
                  className={selectClass}
                >
                  <option value="COSTA_RICA">Costa Rica</option>
                  <option value="GLOBAL">Global</option>
                </select>
              </div>

              {clientType === "PERSON" && (
                <>
                  <FormInput
                    label="Nombre *"
                    value={firstName}
                    onChange={setFirstName}
                    required
                    inputClass={inputClass}
                  />

                  <FormInput
                    label="Primer apellido *"
                    value={lastName1}
                    onChange={setLastName1}
                    required
                    inputClass={inputClass}
                  />

                  <FormInput
                    label="Segundo apellido"
                    value={lastName2}
                    onChange={setLastName2}
                    inputClass={inputClass}
                  />
                </>
              )}

              {clientType === "COMPANY" && (
                <>
                  <FormInput
                    label="Nombre de la empresa / razón social *"
                    value={companyName}
                    onChange={setCompanyName}
                    required
                    inputClass={inputClass}
                  />

                  <FormInput
                    label="Nombre comercial"
                    value={commercialName}
                    onChange={setCommercialName}
                    inputClass={inputClass}
                  />

                  <FormInput
                    label="Contacto principal"
                    value={mainContactName}
                    onChange={setMainContactName}
                    inputClass={inputClass}
                    placeholder="Persona encargada o contacto operativo"
                  />
                </>
              )}

              {clientType === "OTHER" && (
                <>
                  <FormInput
                    label="Nombre del cliente *"
                    value={displayName}
                    onChange={setDisplayName}
                    required
                    inputClass={inputClass}
                  />

                  <FormInput
                    label="Nombre legal"
                    value={legalName}
                    onChange={setLegalName}
                    inputClass={inputClass}
                  />

                  <FormInput
                    label="Contacto principal"
                    value={mainContactName}
                    onChange={setMainContactName}
                    inputClass={inputClass}
                    placeholder="Persona encargada o contacto operativo"
                  />
                </>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tipo de identificación *
                </label>
                <select
                  value={identificationType}
                  onChange={(e) => setIdentificationType(e.target.value)}
                  className={selectClass}
                  required
                >
                  {identificationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FormInput
                  label="Cédula / identificación *"
                  value={taxId}
                  onChange={setTaxId}
                  required
                  inputClass={inputClass}
                  placeholder={
                    complianceProfile === "COSTA_RICA"
                      ? "Sin guiones ni espacios"
                      : "Número de identificación"
                  }
                />

                <p className="mt-1 text-xs text-slate-500">
                  {getIdentificationHelpText(identificationType)}
                </p>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Información de contacto"
            isOpen={openSections.contact}
            onToggle={() => toggleSection("contact")}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Teléfono principal / WhatsApp *"
                value={phonePrimary}
                onChange={setPhonePrimary}
                required
                inputClass={inputClass}
              />

              <FormInput
                label="Teléfono secundario"
                value={phoneSecondary}
                onChange={setPhoneSecondary}
                inputClass={inputClass}
                placeholder="Casa, oficina o celular alternativo"
              />

              <FormInput
                label="Email"
                value={email}
                onChange={setEmail}
                inputClass={inputClass}
                type="email"
              />

              {mode === "edit" && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Estado
                  </label>
                  <select
                    value={clientStatus}
                    onChange={(e) =>
                      setClientStatus(e.target.value as ClientStatus)
                    }
                    className={selectClass}
                  >
                    {CLIENT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <label
                htmlFor="whatsapp_opt_in"
                className="flex cursor-pointer items-center gap-3"
              >
                <input
                  id="whatsapp_opt_in"
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    El cliente autoriza contacto por WhatsApp
                  </p>
                  <p className="text-xs text-slate-500">
                    Se usará el teléfono principal para coordinación de
                    servicios, mantenimientos, recordatorios y seguimiento.
                  </p>
                </div>
              </label>
            </div>
          </FormSection>

          <FormSection
            title="Ubicación"
            isOpen={openSections.location}
            onToggle={() => toggleSection("location")}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Provincia
                </label>
                <select
                  value={adminLevel1}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Seleccione provincia</option>
                  {provinciaOptions.map((provincia) => (
                    <option key={provincia} value={provincia}>
                      {provincia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Cantón
                </label>
                <select
                  value={adminLevel2}
                  onChange={(e) => handleCantonChange(e.target.value)}
                  disabled={!adminLevel1}
                  className={selectClass}
                >
                  <option value="">Seleccione cantón</option>
                  {cantonOptions.map((canton) => (
                    <option key={canton.nombre} value={canton.nombre}>
                      {canton.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Distrito
                </label>
                <select
                  value={adminLevel3}
                  onChange={(e) => setAdminLevel3(e.target.value)}
                  disabled={!adminLevel1 || !adminLevel2}
                  className={selectClass}
                >
                  <option value="">Seleccione distrito</option>
                  {distritoOptions.map((distrito) => (
                    <option key={distrito.nombre} value={distrito.nombre}>
                      {distrito.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <FormInput
                label="Dirección"
                value={addressLine}
                onChange={setAddressLine}
                inputClass={inputClass}
                placeholder="Detalle adicional de la dirección"
                full
              />
            </div>
          </FormSection>

          <FormSection
            title="Configuración financiera"
            isOpen={openSections.finance}
            onToggle={() => toggleSection("finance")}
          >
            <p className="mb-5 text-sm text-slate-500">
              Reglas comerciales opcionales para crédito, descuentos e
              impuestos.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tipo de pago
                </label>
                <select
                  value={paymentTerm}
                  onChange={(e) =>
                    setPaymentTerm(e.target.value as "CASH" | "CREDIT")
                  }
                  className={selectClass}
                >
                  <option value="CASH">Contado</option>
                  <option value="CREDIT">Crédito</option>
                </select>
              </div>

              {paymentTerm === "CREDIT" && (
                <>
                  <FormInput
                    label="Días de crédito *"
                    value={creditDays}
                    onChange={setCreditDays}
                    inputClass={inputClass}
                    type="number"
                    placeholder="Ejemplo: 30"
                    required
                  />

                  <FormInput
                    label="Límite de crédito"
                    value={creditLimit}
                    onChange={setCreditLimit}
                    inputClass={inputClass}
                    type="number"
                    placeholder="Ejemplo: 500000"
                  />
                </>
              )}

              <FormInput
                label="Descuento por defecto (%)"
                value={discountRate}
                onChange={setDiscountRate}
                inputClass={inputClass}
                type="number"
                placeholder="Ejemplo: 10"
              />

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Moneda preferida
                </label>
                <select
                  value={preferredCurrency}
                  onChange={(e) =>
                    setPreferredCurrency(e.target.value as "CRC" | "USD")
                  }
                  className={selectClass}
                >
                  <option value="CRC">Colones costarricenses</option>
                  <option value="USD">Dólares estadounidenses</option>
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <label
                  htmlFor="tax_exempt"
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    id="tax_exempt"
                    type="checkbox"
                    checked={taxExempt}
                    onChange={(e) => setTaxExempt(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Exento de IVA
                    </p>
                    <p className="text-xs text-slate-500">
                      Marque esta opción si al cliente no se le debe aplicar
                      IVA.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Datos de facturación"
            isOpen={openSections.billing}
            onToggle={() => toggleSection("billing")}
          >
            <p className="mb-5 text-sm text-slate-500">
              Puede reutilizar los datos principales del cliente o registrar
              datos de facturación diferentes.
            </p>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <label
                htmlFor="billing_same_as_client"
                className="flex cursor-pointer items-center gap-3"
              >
                <input
                  id="billing_same_as_client"
                  type="checkbox"
                  checked={billingSameAsClient}
                  onChange={(e) => setBillingSameAsClient(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Usar la misma información del cliente para facturación
                  </p>
                  <p className="text-xs text-slate-500">
                    Si está marcado, se usará nombre, teléfono, email y
                    dirección principal.
                  </p>
                </div>
              </label>
            </div>

            {!billingSameAsClient && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Nombre de facturación"
                  value={billingName}
                  onChange={setBillingName}
                  inputClass={inputClass}
                  placeholder="Nombre que aparecerá en la factura"
                />

                <FormInput
                  label="Email de facturación"
                  value={billingEmail}
                  onChange={setBillingEmail}
                  inputClass={inputClass}
                  type="email"
                />

                <FormInput
                  label="Teléfono de facturación"
                  value={billingPhone}
                  onChange={setBillingPhone}
                  inputClass={inputClass}
                />

                <FormInput
                  label="Dirección de facturación"
                  value={billingAddress}
                  onChange={setBillingAddress}
                  inputClass={inputClass}
                  placeholder="Dirección que aparecerá en la factura"
                />
              </div>
            )}
          </FormSection>

          {message && <AlertMessage type="success" text={message} />}
          {error && <AlertMessage type="error" text={error} />}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : mode === "create"
                  ? "Guardar cliente"
                  : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
