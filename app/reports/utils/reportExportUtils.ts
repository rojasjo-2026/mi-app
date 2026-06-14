import type { ReportColumnKey, ReportRow, ReportSource } from "../types";
import { buildReportMatrix, getColumnLabel } from "./reportFormatUtils";

export async function downloadExcelReport(
  filename: string,
  source: ReportSource,
  columns: ReportColumnKey[],
  rows: ReportRow[],
) {
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.aoa_to_sheet(
    buildReportMatrix(source, columns, rows),
  );

  worksheet["!cols"] = columns.map((columnKey) => ({
    wch: Math.min(
      Math.max(getColumnLabel(source, columnKey).length + 8, 16),
      42,
    ),
  }));

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  XLSX.writeFile(workbook, filename, {
    compression: true,
  });
}

export async function downloadPdfReport(
  filename: string,
  title: string,
  source: ReportSource,
  columns: ReportColumnKey[],
  rows: ReportRow[],
) {
  const { default: jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(14);
  doc.text(title, 12, 14);

  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-CR")}`, 12, 21);

  autoTable(doc, {
    startY: 28,
    head: [columns.map((columnKey) => getColumnLabel(source, columnKey))],
    body: rows.map((row) =>
      columns.map((columnKey) => String(row[columnKey] ?? "")),
    ),
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
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
