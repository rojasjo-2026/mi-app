type InstallationStatusAlertsProps = {
  actionMessage?: string;
  isInactive?: boolean;
};

export default function InstallationStatusAlerts({
  actionMessage,
  isInactive = false,
}: InstallationStatusAlertsProps) {
  return (
    <>
      {actionMessage && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
          {actionMessage}
        </div>
      )}

      {isInactive && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          Esta instalación está inactiva. Solo se permite consultar su
          historial.
        </div>
      )}
    </>
  );
}
