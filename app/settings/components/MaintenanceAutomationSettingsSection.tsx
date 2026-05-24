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

type MaintenanceAutomationSettingsSectionProps = {
  form: SettingsForm;
  onFormChange: (nextForm: SettingsForm) => void;
};

export default function MaintenanceAutomationSettingsSection({
  form,
  onFormChange,
}: MaintenanceAutomationSettingsSectionProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Automatización de mantenimiento
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        Configure cómo y cuándo el sistema debe contactar clientes por
        mantenimientos próximos.
      </p>

      <div className="mt-6 space-y-4">
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              WhatsApp activo
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Permite que el sistema utilice WhatsApp para comunicaciones.
            </p>
          </div>

          <input
            type="checkbox"
            checked={form.whatsapp_enabled}
            onChange={(event) =>
              onFormChange({
                ...form,
                whatsapp_enabled: event.target.checked,
              })
            }
            className="h-5 w-5 rounded border-slate-300"
          />
        </label>

        <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Contacto automático
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Activa el envío automático de mensajes para mantenimientos.
            </p>
          </div>

          <input
            type="checkbox"
            checked={form.auto_contact_enabled}
            onChange={(event) =>
              onFormChange({
                ...form,
                auto_contact_enabled: event.target.checked,
              })
            }
            className="h-5 w-5 rounded border-slate-300"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Días antes para contactar
            </span>

            <input
              type="number"
              min={1}
              max={365}
              value={form.maintenance_contact_days_before}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  maintenance_contact_days_before: Number(event.target.value),
                })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />

            <p className="text-xs text-slate-400">
              Este valor aplica de forma general para los clientes que permiten
              contacto por WhatsApp.
            </p>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Hora automática de envío
            </span>

            <input
              type="number"
              min={0}
              max={23}
              value={form.automatic_send_hour}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  automatic_send_hour: Number(event.target.value),
                })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />

            <p className="text-xs text-slate-400">
              Use formato 24 horas. Ejemplo: 9 = 9:00 a. m.
            </p>
          </label>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
          Estos valores funcionarán como configuración general para la
          automatización de mantenimientos. Cada cliente seguirá controlando
          únicamente si permite o no el contacto por WhatsApp.
        </div>
      </div>
    </article>
  );
}
