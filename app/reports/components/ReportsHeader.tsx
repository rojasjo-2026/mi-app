"use client";

type ReportsHeaderProps = {
  rowsLength: number;
  exportingExcel: boolean;
  exportingPdf: boolean;
  pdfAvailable: boolean;
  loading: boolean;
  pdfMaxColumns: number;
  selectedColumnsLength: number;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onRefresh: () => void;
};

export default function ReportsHeader({
  rowsLength,
  exportingExcel,
  exportingPdf,
  pdfAvailable,
  loading,
  pdfMaxColumns,
  selectedColumnsLength,
  onExportExcel,
  onExportPdf,
  onRefresh,
}: ReportsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
          Report builder
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Centro de reportes e importación
        </h1>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Construye reportes por fuente de datos, selecciona columnas, aplica
          filtros y exporta la información que realmente necesitás.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onExportExcel}
          disabled={exportingExcel || rowsLength === 0}
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exportingExcel ? "Exportando..." : "Exportar Excel"}
        </button>

        <button
          type="button"
          onClick={onExportPdf}
          disabled={exportingPdf || !pdfAvailable}
          title={
            selectedColumnsLength > pdfMaxColumns
              ? `PDF disponible solo con ${pdfMaxColumns} columnas o menos`
              : "Exportar reporte presentable en PDF"
          }
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exportingPdf ? "Generando..." : "Exportar PDF"}
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
    </div>
  );
}
