export const TIME_ZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Europe/Istanbul";

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("tr-TR", { timeZone: TIME_ZONE, ...o });

const timeFmt = fmt({ hour: "2-digit", minute: "2-digit", hour12: false });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TIME_ZONE });
const dayTitleFmt = fmt({ day: "numeric", month: "long", year: "numeric", weekday: "long" });
const shortDayFmt = fmt({ day: "numeric", month: "long", weekday: "long" });
const weekdayShortFmt = fmt({ weekday: "short" });
const dayNumFmt = fmt({ day: "numeric" });
const monthTitleFmt = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" });

type DateInput = string | number | Date;

function parts(f: Intl.DateTimeFormat, value: DateInput) {
  const p = f.formatToParts(new Date(value));
  return (type: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === type)?.value ?? "";
}

export function formatTime(value: DateInput): string {
  return timeFmt.format(new Date(value));
}

/** YYYY-MM-DD, uygulama saat diliminde. */
export function dayKey(value: DateInput): string {
  return dayKeyFmt.format(new Date(value));
}

/** "25 Eylül 2026 Cuma" */
export function formatDayTitle(value: DateInput): string {
  const get = parts(dayTitleFmt, value);
  return `${get("day")} ${get("month")} ${get("year")} ${get("weekday")}`;
}

/** "25 Eylül, Cuma" */
export function formatShortDay(value: DateInput): string {
  const get = parts(shortDayFmt, value);
  return `${get("day")} ${get("month")}, ${get("weekday")}`;
}

/** "Cum" */
export function formatWeekdayShort(value: DateInput): string {
  return weekdayShortFmt.format(new Date(value));
}

/** "25" */
export function formatDayNumber(value: DateInput): string {
  return dayNumFmt.format(new Date(value));
}

/** "2026-09" → "Eylül 2026" */
export function formatMonthTitle(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return monthTitleFmt.format(new Date(Date.UTC(y, m - 1, 15)));
}

/** "9 sa 25 dk" veya pad ile "09 sa 25 dk" */
export function formatDuration(ms: number, pad = false): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const p = (n: number) => (pad ? String(n).padStart(2, "0") : String(n));
  return `${p(h)} sa ${p(m)} dk`;
}

/** "09:25" (saat:dakika) */
export function formatClock(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

export function initials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.length === 1 ? words[0].charAt(0) : words[0].charAt(0) + words[words.length - 1].charAt(0);
  return letters.toLocaleUpperCase("tr-TR");
}

export function firstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}
