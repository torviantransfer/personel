import "server-only";
import { getAvatarMap, getAvatarUrl } from "@/lib/avatars";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AttendanceRecord } from "@/types";

export type Workplace = { id: string; name: string; qr_token: string; active: boolean; created_at: string };

export type Staff = {
  id: string;
  full_name: string;
  phone: string | null;
  employee_number: string | null;
  role: string;
  active: boolean;
  workplace_id: string | null;
  workplace_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type Named = { name: string } | { name: string }[] | null;
const nameOf = (v: Named) => (Array.isArray(v) ? v[0]?.name : v?.name) ?? null;

export async function listWorkplaces(): Promise<Workplace[]> {
  const { data, error } = await createAdminClient()
    .from("workplaces")
    .select("id, name, qr_token, active, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Workplace[];
}

export async function getWorkplace(id: string): Promise<Workplace | null> {
  const { data, error } = await createAdminClient()
    .from("workplaces")
    .select("id, name, qr_token, active, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Workplace | null;
}

const STAFF_COLUMNS =
  "id, full_name, phone, employee_number, role, active, workplace_id, created_at, workplace:workplaces!profiles_workplace_id_fkey(name)";

type RawStaff = Omit<Staff, "workplace_name" | "avatar_url"> & { workplace: Named };
const toStaff = ({ workplace, ...rest }: RawStaff, avatar: string | null = null): Staff => ({
  ...rest,
  workplace_name: nameOf(workplace),
  avatar_url: avatar,
});

export async function listStaff(): Promise<Staff[]> {
  const [{ data, error }, avatars] = await Promise.all([createAdminClient().from("profiles").select(STAFF_COLUMNS).order("full_name"), getAvatarMap()]);
  if (error) throw error;
  return (data as RawStaff[]).map((s) => toStaff(s, avatars.get(s.id) ?? null));
}

export async function getStaff(id: string): Promise<Staff | null> {
  const [{ data, error }, avatar] = await Promise.all([createAdminClient().from("profiles").select(STAFF_COLUMNS).eq("id", id).maybeSingle(), getAvatarUrl(id)]);
  if (error) throw error;
  return data ? toStaff(data as RawStaff, avatar) : null;
}

type RawRecord = { id: string; employee_id: string; type: "IN" | "OUT"; created_at: string; workplace: Named };

const PAGE_SIZE = 1000; // Supabase tek istekte en fazla 1000 satır döndürür

/** Tüm personelin (veya tek personelin) tarih aralığındaki kayıtları, employee_id'ye göre gruplu. */
export async function getRecordsSince(
  sinceIso: string,
  employeeId?: string,
  untilIso?: string,
): Promise<Map<string, AttendanceRecord[]>> {
  const admin = createAdminClient();
  const rows: RawRecord[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = admin
      .from("attendance")
      .select("id, employee_id, type, created_at, workplace:workplaces(name)")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (untilIso) query = query.lt("created_at", untilIso);
    if (employeeId) query = query.eq("employee_id", employeeId);

    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data as RawRecord[]));
    if (data.length < PAGE_SIZE) break;
  }

  const map = new Map<string, AttendanceRecord[]>();
  for (const r of rows) {
    const list = map.get(r.employee_id) ?? [];
    list.push({ id: r.id, type: r.type, created_at: r.created_at, workplace_name: nameOf(r.workplace) });
    map.set(r.employee_id, list);
  }
  return map;
}
