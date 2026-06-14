import { NextResponse, type NextRequest } from "next/server";
import { parseClientReportRequest } from "./_lib/filters";
import { getClientReport } from "./_lib/service";

export async function GET(request: NextRequest) {
  try {
    const reportRequest = parseClientReportRequest(request);
    const result = await getClientReport(reportRequest);

    return NextResponse.json({
      success: true,
      source: "clients",
      columns: result.columns,
      data: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error loading client report builder:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo cargar el reporte de clientes",
      },
      { status: 500 },
    );
  }
}
