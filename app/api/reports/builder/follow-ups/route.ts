import { NextResponse, type NextRequest } from "next/server";
import { parseFollowUpReportRequest } from "./_lib/filters";
import { getFollowUpReport } from "./_lib/service";

export async function GET(request: NextRequest) {
  try {
    const reportRequest = parseFollowUpReportRequest(request);
    const result = await getFollowUpReport(reportRequest);

    return NextResponse.json({
      success: true,
      source: "follow-ups",
      columns: result.columns,
      data: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error loading follow-up report builder:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo cargar el reporte de mantenimientos",
      },
      { status: 500 },
    );
  }
}
