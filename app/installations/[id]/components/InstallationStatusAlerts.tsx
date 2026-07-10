type InstallationStatusAlertsProps = {
  actionMessage?: string;
  isInactive?: boolean;
};

export default function InstallationStatusAlerts({
  actionMessage,
  isInactive = false,
}: InstallationStatusAlertsProps) {
  if (!actionMessage && !isInactive) {
    return null;
  }

  return (
    <section className="space-y-3">
      {actionMessage ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
          {actionMessage}
        </div>
      ) : null}

      {isInactive ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
          Esta instalación está inactiva. Solo se permite consultar su
          historial.
        </div>
      ) : null}
    </section>
  );
}
