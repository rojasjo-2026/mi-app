import { NextResponse } from "next/server";
import { runMaintenanceContactFlowsService } from "@/lib/services/maintenanceContactService";

export async function POST() {
  try {
    const result = await runMaintenanceContactFlowsService();

    return NextResponse.json(
      {
        success: true,
        totalCandidates: result.totalCandidates,
        createdFlows: result.createdFlows,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("run contact flows error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
      },
      { status: 500 },
    );
  }
}
