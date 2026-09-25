import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getUserId } from "@/lib/supabase/server";
import type { ScanErrorCode, ScanResponse } from "@/types";

export const dynamic = "force-dynamic";

const QR_PATTERN = /^WORKPLACE:([A-Za-z0-9-]{8,128})$/;

const STATUS: Record<ScanErrorCode, number> = {
  INVALID_QR: 400,
  WORKPLACE_INACTIVE: 403,
  ALREADY_CHECKED_IN: 409,
  ALREADY_CHECKED_OUT: 409,
  WRONG_WORKPLACE: 403,
  NO_WORKPLACE: 403,
  ACCOUNT_INACTIVE: 403,
  PROFILE_NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  SERVER_ERROR: 500,
  NETWORK_ERROR: 503,
};

function fail(code: ScanErrorCode) {
  return NextResponse.json<ScanResponse>({ ok: false, code }, { status: STATUS[code] });
}

export async function POST(request: NextRequest) {
  // Basit CSRF koruması: yalnızca aynı origin'den gelen istekler.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail("UNAUTHORIZED");

  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const raw = typeof body?.code === "string" ? body.code.trim() : "";
  const match = QR_PATTERN.exec(raw);
  if (!match) return fail("INVALID_QR");

  const supabase = await createClient();
  const userId = await getUserId(supabase);
  if (!userId) return fail("UNAUTHORIZED");

  // İşletme kilidi: personel yalnızca kendi işletmesinin QR kodunu okutabilir.
  // (Veritabanı fonksiyonu da aynı kontrolü yapar; burada ek güvence olarak sunucuda da uygulanır.)
  const [{ data: profile }, { data: workplace }] = await Promise.all([
    supabase.from("profiles").select("workplace_id").eq("id", userId).maybeSingle(),
    createAdminClient().from("workplaces").select("id, active").eq("qr_token", match[1]).maybeSingle(),
  ]);
  if (!workplace) return fail("INVALID_QR");
  if (workplace.active) {
    if (!profile?.workplace_id) return fail("NO_WORKPLACE");
    if (profile.workplace_id !== workplace.id) return fail("WRONG_WORKPLACE");
  }

  // Token doğrulama, kimlik, çift kayıt kontrolü ve IN/OUT kararı veritabanında atomik yapılır.
  const { data, error } = await supabase.rpc("record_attendance", { p_qr_token: match[1] });
  if (error || !data) {
    console.error("record_attendance failed", error);
    return fail("SERVER_ERROR");
  }

  const result = data as ScanResponse;
  if (!result.ok) return fail(result.code);
  return NextResponse.json<ScanResponse>(result);
}
