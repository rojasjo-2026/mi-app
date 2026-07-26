"use client";

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
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">
        Automatización de mantenimiento
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        Configure cómo y cuándo el sistema debe contactar clientes por
        mantenimientos próximos.
      </p>

      <div className="mt-5 space-y-3">
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100/70">
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
            className="h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100/70">
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
            className="h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
        </label>

        <div className="grid gap-4 pt-1 md:grid-cols-2">
          <label className="space-y-1.5">
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
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />

            <p className="text-xs leading-5 text-slate-400">
              Aplica a los clientes que permiten contacto por WhatsApp.
            </p>
          </label>

          <label className="space-y-1.5">
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
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />

            <p className="text-xs leading-5 text-slate-400">
              Use formato de 24 horas. Ejemplo: 9 equivale a 9:00 a. m.
            </p>
          </label>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          Estos valores funcionan como configuración general. Cada cliente
          seguirá controlando individualmente si permite el contacto por
          WhatsApp.
        </div>
      </div>
    </article>
  );
}
