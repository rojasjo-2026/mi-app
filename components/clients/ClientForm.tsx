"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { provincias } from "@/lib/data/costa-rica-locations";
import {
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
import {
  COUNTRY_PRESET_OPTIONS,
  COUNTRY_PRESETS,
} from "@/lib/settings/countryPresets";
import AlertMessage from "@/components/clients/form/AlertMessage";
import ClientBasicInfoSection from "@/components/clients/form/ClientBasicInfoSection";
import ClientContactSection from "@/components/clients/form/ClientContactSection";
import ClientLocationSection from "@/components/clients/form/ClientLocationSection";
import ClientFinanceSection from "@/components/clients/form/ClientFinanceSection";
import ClientBillingSection from "@/components/clients/form/ClientBillingSection";
import ClientFormPageHeader from "@/components/clients/form/ClientFormPageHeader";
import ClientFormSummaryPanel, {
  type CompletionItem,
} from "@/components/clients/form/ClientFormSummaryPanel";
import ClientFormStickyActions from "@/components/clients/form/ClientFormStickyActions";
import {
  COSTA_RICA_IDENTIFICATION_OPTIONS,
  DEFAULT_COUNTRY_CODE,
  GLOBAL_IDENTIFICATION_OPTIONS,
  currencyNames,
  type AppSettingsResponse,
  type ClientComplianceProfile,
  type ClientFormData,
  type ClientFormProps,
  type ClientType,
  type SectionKey,
} from "./client-form/clientFormConfig";
import {
  getClientTypeLabel,
  getComplianceProfileLabel,
  getCountryByCode,
  getCountryDisplayName,
  getPaymentTermLabel,
} from "./client-form/clientFormUtils";

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

  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
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
  const [preferredCurrency, setPreferredCurrency] = useState("CRC");

  const [billingSameAsClient, setBillingSameAsClient] = useState(true);
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedCountryPreset = useMemo(
    () => getCountryByCode(countryCode),
    [countryCode],
  );

  const currencyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(COUNTRY_PRESETS).flatMap((preset) =>
            [preset.primaryCurrency, preset.secondaryCurrency].filter(Boolean),
          ),
        ),
      )
        .map((currency) => String(currency))
        .sort()
        .map((currency) => ({
          value: currency,
          label: `${currency} - ${currencyNames[currency] || "Moneda"}`,
        })),
    [],
  );

  const identificationOptions =
    complianceProfile === "COSTA_RICA"
      ? COSTA_RICA_IDENTIFICATION_OPTIONS
      : GLOBAL_IDENTIFICATION_OPTIONS;

  useEffect(() => {
    if (!initialData) return;

    const nextCountryCode =
      initialData.country_code ??
      initialData.identification_country ??
      DEFAULT_COUNTRY_CODE;

    const nextCountryPreset = getCountryByCode(nextCountryCode);
    const nextClientType = initialData.client_type ?? "PERSON";
    const nextComplianceProfile =
      initialData.compliance_profile ??
      (nextCountryPreset.countryCode === "CR" ? "COSTA_RICA" : "GLOBAL");

    setCountryCode(nextCountryPreset.countryCode);
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
    setPreferredCurrency(
      initialData.preferred_currency ?? nextCountryPreset.primaryCurrency,
    );

    setBillingSameAsClient(initialData.billing_same_as_client ?? true);
    setBillingName(initialData.billing_name ?? "");
    setBillingEmail(initialData.billing_email ?? "");
    setBillingPhone(initialData.billing_phone ?? "");
    setBillingAddress(initialData.billing_address ?? "");
  }, [initialData]);

  useEffect(() => {
    let isMounted = true;

    async function loadBusinessCountryFromSettings() {
      try {
        const response = await fetch("/api/settings", {
          cache: "no-store",
        });

        const result: AppSettingsResponse = await response.json();

        if (!response.ok || !result.success || !result.data) {
          return;
        }

        const nextCountryPreset = getCountryByCode(
          result.data.country_code ?? DEFAULT_COUNTRY_CODE,
        );

        const nextComplianceProfile =
          nextCountryPreset.countryCode === "CR" ? "COSTA_RICA" : "GLOBAL";

        const nextClientType = initialData?.client_type ?? clientType;

        if (!isMounted) return;

        setCountryCode(nextCountryPreset.countryCode);
        setComplianceProfile(nextComplianceProfile);
        setIdentificationType(
          getDefaultIdentificationType(nextClientType, nextComplianceProfile),
        );
        setPreferredCurrency(
          result.data.default_currency ?? nextCountryPreset.primaryCurrency,
        );
      } catch {
        // Keep the current form values if system settings cannot be loaded.
      }
    }

    void loadBusinessCountryFromSettings();

    return () => {
      isMounted = false;
    };
  }, [clientType, initialData, mode]);

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

  function handleCountryChange(value: string) {
    const nextCountryPreset = getCountryByCode(value);
    const nextComplianceProfile =
      nextCountryPreset.countryCode === "CR" ? "COSTA_RICA" : "GLOBAL";

    setCountryCode(nextCountryPreset.countryCode);
    setComplianceProfile(nextComplianceProfile);
    setIdentificationType(
      getDefaultIdentificationType(clientType, nextComplianceProfile),
    );
    setPreferredCurrency(nextCountryPreset.primaryCurrency);

    setAdminLevel1("");
    setAdminLevel2("");
    setAdminLevel3("");
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

        country_code: countryCode,
        identification_country: countryCode,
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
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

  const selectClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-400";

  const previewName = resolveDisplayName().trim() || "Cliente en borrador";

  const personalComplete =
    clientType === "PERSON"
      ? Boolean(firstName.trim() && lastName1.trim() && taxId.trim())
      : clientType === "COMPANY"
        ? Boolean((companyName.trim() || legalName.trim()) && taxId.trim())
        : Boolean((displayName.trim() || legalName.trim()) && taxId.trim());

  const contactComplete = Boolean(phonePrimary.trim());

  const locationComplete = Boolean(countryCode);

  const financeComplete = Boolean(paymentTerm && preferredCurrency);

  const billingComplete =
    billingSameAsClient ||
    Boolean(
      billingName.trim() ||
      billingEmail.trim() ||
      billingPhone.trim() ||
      billingAddress.trim(),
    );

  const completionItems: CompletionItem[] = [
    { label: "Información del cliente", completed: personalComplete },
    { label: "Información de contacto", completed: contactComplete },
    { label: "Ubicación", completed: locationComplete },
    { label: "Configuración financiera", completed: financeComplete },
    { label: "Datos de facturación", completed: billingComplete },
  ];

  const totalSections = completionItems.length;

  const completedSections = completionItems.filter(
    (item) => item.completed,
  ).length;

  const progressPercent = Math.round((completedSections / totalSections) * 100);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900 md:p-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-[1500px] flex-col gap-6"
      >
        <ClientFormPageHeader mode={mode} saving={saving} onBack={handleBack} />

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <ClientBasicInfoSection
              isOpen={openSections.personal}
              onToggle={() => toggleSection("personal")}
              clientType={clientType}
              complianceProfile={complianceProfile}
              identificationType={identificationType}
              taxId={taxId}
              firstName={firstName}
              lastName1={lastName1}
              lastName2={lastName2}
              displayName={displayName}
              legalName={legalName}
              companyName={companyName}
              commercialName={commercialName}
              mainContactName={mainContactName}
              identificationOptions={identificationOptions}
              inputClass={inputClass}
              selectClass={selectClass}
              handleClientTypeChange={handleClientTypeChange}
              handleComplianceProfileChange={handleComplianceProfileChange}
              setFirstName={setFirstName}
              setLastName1={setLastName1}
              setLastName2={setLastName2}
              setDisplayName={setDisplayName}
              setLegalName={setLegalName}
              setCompanyName={setCompanyName}
              setCommercialName={setCommercialName}
              setMainContactName={setMainContactName}
              setIdentificationType={setIdentificationType}
              setTaxId={setTaxId}
              getIdentificationHelpText={getIdentificationHelpText}
            />

            <ClientContactSection
              mode={mode}
              phonePrimary={phonePrimary}
              phoneSecondary={phoneSecondary}
              email={email}
              clientStatus={clientStatus}
              whatsappOptIn={whatsappOptIn}
              phoneExample={selectedCountryPreset.phoneExample}
              inputClass={inputClass}
              selectClass={selectClass}
              isOpen={openSections.contact}
              onToggle={() => toggleSection("contact")}
              setPhonePrimary={setPhonePrimary}
              setPhoneSecondary={setPhoneSecondary}
              setEmail={setEmail}
              setClientStatus={setClientStatus}
              setWhatsappOptIn={setWhatsappOptIn}
            />

            <ClientLocationSection
              isOpen={openSections.location}
              onToggle={() => toggleSection("location")}
              countryCode={countryCode}
              countryPreset={selectedCountryPreset}
              countryOptions={COUNTRY_PRESET_OPTIONS}
              adminLevel1={adminLevel1}
              adminLevel2={adminLevel2}
              adminLevel3={adminLevel3}
              addressLine={addressLine}
              provinciaOptions={provinciaOptions}
              cantonOptions={cantonOptions}
              distritoOptions={distritoOptions}
              handleCountryChange={handleCountryChange}
              handleProvinceChange={handleProvinceChange}
              handleCantonChange={handleCantonChange}
              setAdminLevel1={setAdminLevel1}
              setAdminLevel2={setAdminLevel2}
              setAdminLevel3={setAdminLevel3}
              setAddressLine={setAddressLine}
              selectClass={selectClass}
              inputClass={inputClass}
            />

            <ClientFinanceSection
              isOpen={openSections.finance}
              onToggle={() => toggleSection("finance")}
              paymentTerm={paymentTerm}
              creditDays={creditDays}
              creditLimit={creditLimit}
              discountRate={discountRate}
              preferredCurrency={preferredCurrency}
              taxExempt={taxExempt}
              countryPreset={selectedCountryPreset}
              currencyOptions={currencyOptions}
              setPaymentTerm={setPaymentTerm}
              setCreditDays={setCreditDays}
              setCreditLimit={setCreditLimit}
              setDiscountRate={setDiscountRate}
              setPreferredCurrency={setPreferredCurrency}
              setTaxExempt={setTaxExempt}
              selectClass={selectClass}
              inputClass={inputClass}
            />

            <ClientBillingSection
              isOpen={openSections.billing}
              onToggle={() => toggleSection("billing")}
              billingSameAsClient={billingSameAsClient}
              billingName={billingName}
              billingEmail={billingEmail}
              billingPhone={billingPhone}
              billingAddress={billingAddress}
              setBillingSameAsClient={setBillingSameAsClient}
              setBillingName={setBillingName}
              setBillingEmail={setBillingEmail}
              setBillingPhone={setBillingPhone}
              setBillingAddress={setBillingAddress}
              inputClass={inputClass}
            />

            {message && <AlertMessage type="success" text={message} />}
            {error && <AlertMessage type="error" text={error} />}
          </div>

          <ClientFormSummaryPanel
            mode={mode}
            previewName={previewName}
            clientTypeLabel={getClientTypeLabel(clientType)}
            countryLabel={getCountryDisplayName(countryCode)}
            complianceLabel={getComplianceProfileLabel(complianceProfile)}
            whatsappOptIn={whatsappOptIn}
            billingSameAsClient={billingSameAsClient}
            paymentTermLabel={getPaymentTermLabel(paymentTerm)}
            preferredCurrency={preferredCurrency}
            completedSections={completedSections}
            totalSections={totalSections}
            progressPercent={progressPercent}
            completionItems={completionItems}
          />
        </div>

        <ClientFormStickyActions
          mode={mode}
          saving={saving}
          completedSections={completedSections}
          totalSections={totalSections}
          onBack={handleBack}
        />
      </form>
    </main>
  );
}

