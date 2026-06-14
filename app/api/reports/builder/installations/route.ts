import { NextResponse, type NextRequest } from "next/server";
import { parseInstallationReportRequest } from "./_lib/filters";
import { getInstallationReport } from "./_lib/service";

export async function GET(request: NextRequest) {
  try {
    const reportRequest = parseInstallationReportRequest(request);
    const result = await getInstallationReport(reportRequest);

    return NextResponse.json({
      success: true,
      source: "installations",
      columns: result.columns,
      data: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error loading installation report builder:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo cargar el reporte de instalaciones",
      },
      { status: 500 },
    );
  }
}
