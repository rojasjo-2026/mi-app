import type {
  CountryPreset,
  CountryTimezoneOption,
} from "@/lib/settings/countryPresets";

type SettingsForm = {
  company_name: string | null;
  company_phone: string | null;
  company_email: string | null;

  country_code: string;
  country_name: string;

  admin_level_1_label: string;
  admin_level_2_label: string;
  admin_level_3_label: string | null;

  timezone: string;
  default_currency: string;
  default_tax_rate: number;

  whatsapp_enabled: boolean;
  auto_contact_enabled: boolean;
  maintenance_contact_days_before: number;
  automatic_send_hour: number;
};

type CountryOption = {
  value: string;
  label: string;
};

type GeneralSettingsSectionProps = {
  form: SettingsForm;
  selectedCountryPreset: CountryPreset;
  timezoneOptions: CountryTimezoneOption[];
  countryPresetMessage: string;
  countryOptions: CountryOption[];
  currencyOptions: string[];
  currencyNames: Record<string, string>;
  taxModeLabels: Record<CountryPreset["taxMode"], string>;
  onFormChange: (nextForm: SettingsForm) => void;
  onCountryChange: (countryCode: string) => void;
};

export default function GeneralSettingsSection({
  form,
  selectedCountryPreset,
  timezoneOptions,
  countryPresetMessage,
  countryOptions,
  currencyOptions,
  currencyNames,
  taxModeLabels,
  onFormChange,
  onCountryChange,
}: GeneralSettingsSectionProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Configuración general
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Defina los datos base de la empresa, ubicación, moneda, impuestos y zona
        horaria. Al seleccionar un país, CLARIUS sugerirá valores regionales que
        pueden modificarse manualmente.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Nombre de la empresa
          </span>

          <input
            value={form.company_name || ""}
            onChange={(event) =>
              onFormChange({
                ...form,
                company_name: event.target.value,
              })
            }
            placeholder="Ej. Mi empresa"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Teléfono de la empresa
          </span>

          <input
            value={form.company_phone || ""}
            onChange={(event) =>
              onFormChange({
                ...form,
                company_phone: event.target.value,
              })
            }
            placeholder={`Ej. ${selectedCountryPreset.phoneExample}`}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">
            Correo de la empresa
          </span>

          <input
            value={form.company_email || ""}
            onChange={(event) =>
              onFormChange({
                ...form,
                company_email: event.target.value,
              })
            }
            placeholder="correo@empresa.com"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Código de país
          </span>

          <select
            value={form.country_code}
            onChange={(event) => onCountryChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          >
            {countryOptions.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>

          <p className="text-xs text-slate-400">
            Se usa para sugerir reglas regionales, formatos, moneda, impuestos y
            zona horaria.
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">País</span>

          <input
            value={form.country_name}
            readOnly
            className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
          />
        </label>

        {countryPresetMessage ? (
          <div className="md:col-span-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
            {countryPresetMessage}
          </div>
        ) : null}

        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-sm font-semibold text-slate-800">
            Valores sugeridos por país
          </p>

          <div className="mt-3 grid gap-3 text-xs text-slate-600 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <span className="font-semibold text-slate-700">
                Prefijo telefónico:
              </span>{" "}
              {selectedCountryPreset.phonePrefix}
            </div>

            <div>
              <span className="font-semibold text-slate-700">
                Ejemplo teléfono:
              </span>{" "}
              {selectedCountryPreset.phoneExample}
            </div>

            <div>
              <span className="font-semibold text-slate-700">
                Moneda principal:
              </span>{" "}
              {selectedCountryPreset.primaryCurrency}{" "}
              {selectedCountryPreset.currencySymbol}
            </div>

            <div>
              <span className="font-semibold text-slate-700">
                Moneda secundaria:
              </span>{" "}
              {selectedCountryPreset.secondaryCurrency || "No definida"}
            </div>

            <div>
              <span className="font-semibold text-slate-700">
                Formato regional:
              </span>{" "}
              {selectedCountryPreset.locale}
            </div>

            <div>
              <span className="font-semibold text-slate-700">
                Formato de fecha:
              </span>{" "}
              {selectedCountryPreset.dateFormat}
            </div>

            <div>
              <span className="font-semibold text-slate-700">
                Impuesto sugerido:
              </span>{" "}
              {selectedCountryPreset.taxLabel}{" "}
              {selectedCountryPreset.defaultTaxRate}%
            </div>

            <div>
              <span className="font-semibold text-slate-700">
                Modo de impuesto:
              </span>{" "}
              {taxModeLabels[selectedCountryPreset.taxMode]}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Validación y datos regionales
            </p>

            <div className="mt-3 grid gap-4 text-xs text-slate-600 md:grid-cols-2">
              <div className="md:col-span-2">
                <span className="font-semibold text-slate-700">
                  Tipos de identificación:
                </span>

                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCountryPreset.identificationTypes.map(
                    (identificationType) => (
                      <span
                        key={identificationType.code}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600"
                      >
                        {identificationType.label}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700">
                  Ejemplo de dirección:
                </span>{" "}
                {selectedCountryPreset.addressExample}
              </div>

              <div>
                <span className="font-semibold text-slate-700">Teléfono:</span>{" "}
                {selectedCountryPreset.phoneValidation.minDigits ===
                selectedCountryPreset.phoneValidation.maxDigits
                  ? `${selectedCountryPreset.phoneValidation.minDigits} dígitos`
                  : `${selectedCountryPreset.phoneValidation.minDigits}-${selectedCountryPreset.phoneValidation.maxDigits} dígitos`}
                {" · "}
                Ej. {selectedCountryPreset.phoneValidation.internationalExample}
              </div>

              <div className="md:col-span-2">
                <span className="font-semibold text-slate-700">
                  Regla fiscal:
                </span>{" "}
                {selectedCountryPreset.regionalTaxRules.description}
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-400">
            Estos valores son una guía regional. La moneda principal, zona
            horaria, impuesto, niveles administrativos, identificación y reglas
            fiscales pueden ajustarse o validarse según la operación real de
            cada negocio.
          </p>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Nivel administrativo 1
          </span>

          <input
            value={form.admin_level_1_label}
            onChange={(event) =>
              onFormChange({
                ...form,
                admin_level_1_label: event.target.value,
              })
            }
            placeholder={selectedCountryPreset.adminLevel1Label}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-300 placeholder:italic focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Nivel administrativo 2
          </span>

          <input
            value={form.admin_level_2_label}
            onChange={(event) =>
              onFormChange({
                ...form,
                admin_level_2_label: event.target.value,
              })
            }
            placeholder={selectedCountryPreset.adminLevel2Label}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-300 placeholder:italic focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Nivel administrativo 3
          </span>

          <input
            value={form.admin_level_3_label || ""}
            onChange={(event) =>
              onFormChange({
                ...form,
                admin_level_3_label: event.target.value,
              })
            }
            placeholder={selectedCountryPreset.adminLevel3Label ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-300 placeholder:italic focus:border-slate-400"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Zona horaria
          </span>

          <select
            value={form.timezone}
            onChange={(event) =>
              onFormChange({
                ...form,
                timezone: event.target.value,
              })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          >
            {timezoneOptions.map((timezoneOption) => (
              <option key={timezoneOption.value} value={timezoneOption.value}>
                {timezoneOption.label} - {timezoneOption.value}
              </option>
            ))}
          </select>

          <p className="text-xs text-slate-400">
            Si el país tiene más de una zona horaria, seleccione la que
            corresponde a la operación principal.
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Moneda principal
          </span>

          <select
            value={form.default_currency}
            onChange={(event) =>
              onFormChange({
                ...form,
                default_currency: event.target.value,
              })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          >
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency} - {currencyNames[currency] || "Moneda"}
              </option>
            ))}
          </select>

          <p className="text-xs text-slate-400">
            Se autocompleta según el país, pero puede cambiarse si la empresa
            opera con otra moneda.
          </p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Impuesto por defecto (%)
          </span>

          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={form.default_tax_rate}
            onChange={(event) =>
              onFormChange({
                ...form,
                default_tax_rate: Number(event.target.value),
              })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />

          <p className="text-xs text-slate-400">
            Es una tasa sugerida. Puede ajustarse según la operación, provincia,
            estado o régimen fiscal aplicable.
          </p>
        </label>
      </div>
    </article>
  );
}
