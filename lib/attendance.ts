import type { AttendanceRecord } from "@/types";
import { dayKey } from "@/lib/format";

/** Veritabanındaki record_attendance() ile aynı olmalı. */
export const MAX_SHIFT_MS = 16 * 60 * 60 * 1000;

export type Session = {
  id: string;
  inAt: string;
  outAt: string | null;
  /** Çıkış yapılmamış ve hâlâ devam eden mesai */
  open: boolean;
  workplaceName: string | null;
};

export type DaySummary = {
  key: string;
  date: string;
  firstIn: string;
  lastOut: string | null;
  open: boolean;
  workedMs: number;
  sessions: Session[];
};

/** IN/OUT kayıtlarını (herhangi bir sırada) mesai oturumlarına çevirir. Sonuç eskiden yeniye sıralıdır. */
export function buildSessions(records: AttendanceRecord[], now: number): Session[] {
  const sorted = [...records].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const sessions: Session[] = [];
  let current: Session | null = null;

  for (const r of sorted) {
    if (r.type === "IN") {
      if (current) sessions.push(current);
      current = { id: r.id, inAt: r.created_at, outAt: null, open: false, workplaceName: r.workplace_name };
    } else if (current) {
      current.outAt = r.created_at;
      sessions.push(current);
      current = null;
    }
  }
  if (current) {
    current.open = now - new Date(current.inAt).getTime() < MAX_SHIFT_MS;
    sessions.push(current);
  }
  return sessions;
}

export function sessionDuration(s: Session, now: number): number {
  const start = new Date(s.inAt).getTime();
  const end = s.outAt ? new Date(s.outAt).getTime() : s.open ? now : start;
  return Math.max(0, end - start);
}

/** Oturumları giriş gününe göre gruplar, en yeni gün en üstte. */
export function groupByDay(sessions: Session[], now: number): DaySummary[] {
  const map = new Map<string, DaySummary>();
  for (const s of sessions) {
    const key = dayKey(s.inAt);
    let day = map.get(key);
    if (!day) {
      day = { key, date: s.inAt, firstIn: s.inAt, lastOut: null, open: false, workedMs: 0, sessions: [] };
      map.set(key, day);
    }
    day.sessions.push(s);
    day.workedMs += sessionDuration(s, now);
    if (s.outAt) day.lastOut = s.outAt;
    day.open = s.open;
  }
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}

/** Bugünün özeti: bugün başlayan oturumlar + (gece yarısını geçmiş) açık oturum. */
export function todaySummary(records: AttendanceRecord[], now: number) {
  const sessions = buildSessions(records, now);
  const today = dayKey(now);
  const todays = sessions.filter((s) => s.open || dayKey(s.inAt) === today);
  const openSession = sessions.find((s) => s.open) ?? null;
  const last = todays.at(-1) ?? null;

  return {
    openSession,
    sessions: todays,
    firstIn: todays[0]?.inAt ?? null,
    lastOut: last && !last.open ? last.outAt : null,
    workedMs: todays.reduce((sum, s) => sum + sessionDuration(s, now), 0),
  };
}

/** Sunucu bileşenleri için istek anındaki zaman (her istek tek kez render edilir). */
export function requestTime(): number {
  return Date.now();
}
