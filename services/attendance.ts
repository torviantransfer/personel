import type { AttendanceRecord, Profile, ScanResponse } from "@/types";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

type RawRecord = {
  id: string;
  type: "IN" | "OUT";
  created_at: string;
  workplace: { name: string } | { name: string }[] | null;
};

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/** Sunucu: kullanıcının belirli tarihten sonraki kayıtları (RLS yalnızca kendi kayıtlarını döndürür). */
export async function getAttendanceSince(supabase: ServerClient, userId: string, sinceIso: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("id, type, created_at, workplace:workplaces(name)")
    .eq("employee_id", userId)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw error;
  return ((data ?? []) as RawRecord[]).map((r) => ({
    id: r.id,
    type: r.type,
    created_at: r.created_at,
    workplace_name: one(r.workplace)?.name ?? null,
  }));
}

/** Sunucu: kullanıcının kendi profili. */
export async function getProfile(supabase: ServerClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, employee_number, role, active, workplace:workplaces!profiles_workplace_id_fkey(name)")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const { workplace, ...rest } = data as Omit<Profile, "workplace_name"> & { workplace: RawRecord["workplace"] };
  return { ...rest, workplace_name: one(workplace)?.name ?? null };
}

/** İstemci: okunan QR içeriğini sunucuya gönderir. */
export async function submitScan(code: string): Promise<ScanResponse> {
  try {
    const res = await fetch("/api/attendance/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as ScanResponse | null;
    return json ?? { ok: false, code: "SERVER_ERROR" };
  } catch {
    return { ok: false, code: "NETWORK_ERROR" };
  }
}

/** Sunucu: kullanıcının son kaydı (mesai durumunu belirlemek için). */
export async function getLastRecord(supabase: ServerClient, userId: string): Promise<AttendanceRecord | null> {
  const records = await getAttendanceSince(supabase, userId, new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
  return records[0] ?? null;
}
