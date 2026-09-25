import { CalendarDays } from "lucide-react";
import { Badge, Card, DateTile, EmptyState, SectionTitle } from "@/components/ui";
import type { DaySummary } from "@/lib/attendance";
import { formatDayNumber, formatMonthTitle, formatTime, formatWeekdayShort } from "@/lib/format";

/** Günlük kayıtları ay başlıklarıyla listeler (en yeni üstte). */
export default function DayList({ days, todayKey }: { days: DaySummary[]; todayKey: string }) {
  if (days.length === 0) {
    return (
      <Card>
        <EmptyState icon={CalendarDays} title="Kayıt bulunmuyor" />
      </Card>
    );
  }

  const months = new Map<string, DaySummary[]>();
  for (const d of days) {
    const key = d.key.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), d]);
  }

  return (
    <div className="space-y-6">
      {[...months.entries()].map(([month, list]) => (
        <div key={month}>
          <SectionTitle
            action={
              <span className="text-[13px] font-semibold text-body tabular-nums">
                {list.length} gün
              </span>
            }
          >
            {formatMonthTitle(month)}
          </SectionTitle>
          <Card>
            <ul className="divide-y divide-line">
              {list.map((day) => (
                <li key={day.key} className="flex items-center gap-3.5 px-4 py-3.5">
                  <DateTile day={formatDayNumber(day.date)} weekday={formatWeekdayShort(day.date)} highlight={day.key === todayKey} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold tabular-nums">
                      {formatTime(day.firstIn)}
                      <span className="mx-1.5 text-faint">–</span>
                      {day.open ? "…" : day.lastOut ? formatTime(day.lastOut) : "--:--"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {day.sessions[0]?.workplaceName}
                      {day.sessions.length > 1 && ` · ${day.sessions.length} giriş`}
                    </p>
                  </div>
                  {day.open ? (
                    <Badge tone="success" dot pulse>
                      Mesaide
                    </Badge>
                  ) : !day.lastOut ? (
                    <Badge tone="warning">Çıkış yok</Badge>
                  ) : (
                    <Badge tone="neutral">Çıktı</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ))}
    </div>
  );
}
