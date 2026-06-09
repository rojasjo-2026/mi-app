export function PaymentInfoNote() {
  return (
    <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      <p className="font-semibold">
        Solo se muestran facturas con saldo pendiente mayor a cero.
      </p>
      <p className="mt-1">
        Las facturas pagadas en su totalidad no se muestran en esta sección.
      </p>
    </div>
  );
}
