import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildReport, parseReportParams, reportToCsv } from "@/services/report";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const params = parseReportParams(Object.fromEntries(request.nextUrl.searchParams));
  const { rows } = await buildReport(params);

  return new Response(reportToCsv(params, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="MesaiGo-rapor-${params.period}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
