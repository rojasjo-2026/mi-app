"use client";

import { useState } from "react";
import type { ClientImportCommitResponse, ImportPreviewRow } from "../types";
import {
  buildClientTemplateExcel,
  previewClientImportFile,
} from "../utils/reportImportUtils";

type ReportImportPanelProps = {
  importPreview: ImportPreviewRow[];
  onPreviewChange: (rows: ImportPreviewRow[]) => void;
};

export default function ReportImportPanel({
  importPreview,
  onPreviewChange,
}: ReportImportPanelProps) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] =
    useState<ClientImportCommitResponse | null>(null);
  const [importError, setImportError] = useState("");

  const validImportRows = importPreview.filter(
    (row) => row.status === "Valid",
  ).length;

  const invalidImportRows = importPreview.filter(
    (row) => row.status === "Error",
  ).length;

  async function handleImportFile(file?: File | null) {
    if (!file) return;

    try {
      setImportError("");
      setImportResult(null);

      const previewRows = await previewClientImportFile(file);
      onPreviewChange(previewRows);
    } catch (error) {
      console.error(error);

      onPreviewChange([
        {
          rowNumber: 0,
          clientName: "-",
          phone: "-",
          email: "-",
          status: "Error",
          message: "No se pudo leer el archivo Excel",
          rawData: {},
        },
      ]);
    }
  }

  async function commitValidRows() {
    const rowsToImport = importPreview
      .filter((row) => row.status === "Valid")
      .map((row) => row.rawData);

    if (rowsToImport.length === 0) return;

    try {
      setImporting(true);
      setImportError("");
      setImportResult(null);

      const response = await fetch("/api/imports/clients/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: rowsToImport,
        }),
      });

      const result: ClientImportCommitResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "No se pudo importar clientes");
      }

      setImportResult(result);
    } catch (error) {
      console.error(error);
      setImportError("No se pudo completar la importación de clientes");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Importación segura
        </p>

        <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
          Importar clientes desde Excel
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Descarga la plantilla, completa la información y sube el archivo para
          revisar errores antes de crear clientes en el sistema.
        </p>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => void buildClientTemplateExcel()}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Descargar plantilla Excel
          </button>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50">
            <span className="text-sm font-semibold text-slate-800">
              Subir archivo Excel
            </span>
            <span className="mt-1 text-xs leading-5 text-slate-500">
              Se valida en preview antes de guardar. Formatos permitidos: .xlsx
              o .xls.
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) =>
                void handleImportFile(event.target.files?.[0])
              }
            />
          </label>
        </div>

        {importResult && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold">Importación procesada</p>
            <p className="mt-1">
              Creados: {importResult.createdCount ?? 0} · Omitidos:{" "}
              {importResult.skippedCount ?? 0} · Errores:{" "}
              {importResult.errorCount ?? 0}
            </p>
          </div>
        )}

        {importError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {importError}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Preview de importación
          </p>

          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
            Validación antes de guardar
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {validImportRows} filas válidas · {invalidImportRows} filas con
            errores
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <th className="border-b border-r border-slate-200 px-4 py-3">
                  Fila
                </th>
                <th className="border-b border-r border-slate-200 px-4 py-3">
                  Cliente
                </th>
                <th className="border-b border-r border-slate-200 px-4 py-3">
                  Teléfono
                </th>
                <th className="border-b border-r border-slate-200 px-4 py-3">
                  Email
                </th>
                <th className="border-b border-r border-slate-200 px-4 py-3">
                  Estado
                </th>
                <th className="border-b border-slate-200 px-4 py-3">Mensaje</th>
              </tr>
            </thead>

            <tbody>
              {importPreview.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm font-medium text-slate-500"
                  >
                    Aún no se ha cargado ningún archivo.
                  </td>
                </tr>
              ) : (
                importPreview.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="border-b border-r border-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                      {row.rowNumber}
                    </td>
                    <td className="border-b border-r border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                      {row.clientName}
                    </td>
                    <td className="border-b border-r border-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                      {row.phone}
                    </td>
                    <td className="border-b border-r border-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                      {row.email}
                    </td>
                    <td className="border-b border-r border-slate-100 px-4 py-3">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                          row.status === "Valid"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                            : "bg-red-50 text-red-700 ring-red-100",
                        ].join(" ")}
                      >
                        {row.status === "Valid" ? "Válida" : "Error"}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                      {row.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={() => void commitValidRows()}
            disabled={importing || validImportRows === 0}
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {importing ? "Creando clientes..." : "Crear clientes válidos"}
          </button>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Los clientes se vuelven a validar en servidor antes de guardarse.
            Los duplicados por teléfono, email, tax_id o identificación se
            omiten automáticamente.
          </p>

          {importResult?.details && importResult.details.length > 0 && (
            <div className="mt-4 max-h-[220px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50">
              {importResult.details.map((detail) => (
                <div
                  key={`${detail.rowNumber}-${detail.clientName}`}
                  className="border-b border-slate-200 px-4 py-3 last:border-b-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Fila {detail.rowNumber}
                    </span>

                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                        detail.status === "created"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                          : detail.status === "skipped"
                            ? "bg-amber-50 text-amber-700 ring-amber-100"
                            : "bg-red-50 text-red-700 ring-red-100",
                      ].join(" ")}
                    >
                      {detail.status === "created"
                        ? "Creado"
                        : detail.status === "skipped"
                          ? "Omitido"
                          : "Error"}
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                      {detail.clientName}
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {detail.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
