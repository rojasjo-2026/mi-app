import type { ClientColumnKey, ReportRow } from "../types";
import {
  buildReportMatrix,
  formatCellValue,
  getColumnLabel,
} from "./reportFormatUtils";

export async function downloadExcelReport(
  filename: string,
  columns: ClientColumnKey[],
  rows: ReportRow[],
) {
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.aoa_to_sheet(buildReportMatrix(columns, rows));

  worksheet["!cols"] = columns.map((columnKey) => ({
    wch: Math.min(Math.max(getColumnLabel(columnKey).length + 8, 16), 42),
  }));

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  XLSX.writeFile(workbook, filename, { compression: true });
}

export async function downloadPdfReport(
  filename: string,
  columns: ClientColumnKey[],
  rows: ReportRow[],
  totalItems: number,
) {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const generatedAt = new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const headers = columns.map((columnKey) => getColumnLabel(columnKey));

  const body = rows.map((row) =>
    columns.map((columnKey) =>
      formatCellValue(columnKey, row[columnKey] ?? ""),
    ),
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("CLARIUS - Reporte de clientes", 12, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado: ${generatedAt}`, 12, 21);
  doc.text(`Registros en PDF: ${rows.length}`, 12, 27);
  doc.text(`Registros encontrados: ${totalItems}`, 12, 33);

  if (totalItems > rows.length) {
    doc.setFont("helvetica", "bold");
    doc.text(
      `Nota: PDF limitado a ${rows.length} registros para mantener un formato presentable.`,
      12,
      39,
    );
  }

  autoTable(doc, {
    head: [headers],
    body,
    startY: totalItems > rows.length ? 45 : 39,
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: {
      left: 12,
      right: 12,
    },
  });

  doc.save(filename);
}
