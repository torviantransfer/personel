import "server-only";
import { buildSessions, groupByDay, requestTime, type DaySummary } from "@/lib/attendance";
import { dayKey, formatDayTitle, formatTime } from "@/lib/format";
import { getRecordsSince, listStaff, listWorkplaces, type Staff } from "@/services/admin";

export type ReportMode = "day" | "month";

export type ReportParams = { mode: ReportMode; period: string; workplaceId: string | null };

export type ReportRow = {
  staff: Staff;
  days: DaySummary[];
  /** Günlük: o günün özeti */
  day: DaySummary | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const monthFmt = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" });

export function parseReportParams(sp: Record<string, string | string[] | undefined>): ReportParams {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const mode: ReportMode = get("mode") === "month" ? "month" : "day";
  const today = dayKey(requestTime());
  const raw = get("period");
  const period =
    mode === "day" ? (/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today) : /^\d{4}-\d{2}$/.test(raw) ? raw : today.slice(0, 7);
  const w = get("w");
  return { mode, period, workplaceId: /^[0-9a-f-]{36}$/i.test(w) ? w : null };
}

export function periodTitle({ mode, period }: ReportParams): string {
  if (mode === "day") return formatDayTitle(`${period}T12:00:00Z`);
  const [y, m] = period.split("-").map(Number);
  return monthFmt.format(new Date(Date.UTC(y, m - 1, 15)));
}

export async function buildReport(params: ReportParams) {
  const { mode, period, workplaceId } = params;
  const now = requestTime();

  // Saat dilimi farkını kapsamak için aralık her iki yönde 1 gün geniş alınır; gün eşleşmesi dayKey ile yapılır.
  let start: number, end: number;
  if (mode === "day") {
    start = Date.parse(`${period}T00:00:00Z`) - DAY_MS;
    end = start + 3 * DAY_MS;
  } else {
    const [y, m] = period.split("-").map(Number);
    start = Date.UTC(y, m - 1, 1) - DAY_MS;
    end = Date.UTC(y, m, 1) + DAY_MS;
  }

  const [staff, workplaces, records] = await Promise.all([
    listStaff(),
    listWorkplaces(),
    getRecordsSince(new Date(start).toISOString(), undefined, new Date(Math.min(end, now + DAY_MS)).toISOString()),
  ]);

  const inPeriod = (d: DaySummary) => (mode === "day" ? d.key === period : d.key.startsWith(period));

  const rows: ReportRow[] = staff
    .filter((s) => s.role === "employee" && (!workplaceId || s.workplace_id === workplaceId))
    .map((s) => {
      const days = groupByDay(buildSessions(records.get(s.id) ?? [], now), now).filter(inPeriod);
      return { staff: s, days, day: mode === "day" ? (days[0] ?? null) : null };
    })
    // Pasif personel yalnızca o dönemde kaydı varsa gösterilir
    .filter((r) => r.staff.active || r.days.length > 0)
    .sort((a, b) => a.staff.full_name.localeCompare(b.staff.full_name, "tr"));

  return { rows, workplaces, now };
}

/** Excel (Türkçe) uyumlu CSV: ; ayraçlı, UTF-8 BOM'lu. */
export function reportToCsv(params: ReportParams, rows: ReportRow[]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines: (string | number)[][] = [];

  if (params.mode === "day") {
    lines.push(["Personel", "Sicil No", "İşletme", "Giriş", "Çıkış", "Durum"]);
    for (const r of rows) {
      const d = r.day;
      lines.push([
        r.staff.full_name,
        r.staff.employee_number ?? "",
        r.staff.workplace_name ?? "",
        d ? formatTime(d.firstIn) : "",
        d?.lastOut && !d.open ? formatTime(d.lastOut) : "",
        !d ? "Gelmedi" : d.open ? "Mesaide" : d.lastOut ? "Geldi" : "Çıkış yapmadı",
      ]);
    }
  } else {
    lines.push(["Personel", "Sicil No", "İşletme", "Geldiği Gün", "Çıkış Yapmadığı Gün"]);
    for (const r of rows) {
      lines.push([
        r.staff.full_name,
        r.staff.employee_number ?? "",
        r.staff.workplace_name ?? "",
        r.days.length,
        r.days.filter((d) => !d.open && !d.lastOut).length,
      ]);
    }
  }
  return "﻿" + lines.map((l) => l.map(esc).join(";")).join("\r\n");
}
