"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Download, LoaderCircle } from "lucide-react";
import { Select } from "@/components/admin/Form";
import { formatDayTitle, formatMonthTitle } from "@/lib/format";

type Props = {
  mode: "day" | "month";
  period: string;
  today: string;
  workplaceId: string | null;
  workplaces: { id: string; name: string }[];
};

function shift(mode: "day" | "month", period: string, step: number): string {
  if (mode === "day") {
    const d = new Date(`${period}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + step);
    return d.toISOString().slice(0, 10);
  }
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + step, 1));
  return d.toISOString().slice(0, 7);
}

export default function ReportFilters({ mode, period, today, workplaceId, workplaces }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const query = (next: { mode?: "day" | "month"; period?: string; w?: string }) => {
    const p = new URLSearchParams();
    const m = next.mode ?? mode;
    p.set("mode", m);
    const per = next.mode && next.mode !== mode ? "" : (next.period ?? period);
    if (per) p.set("period", per);
    const w = next.w ?? workplaceId ?? "";
    if (w) p.set("w", w);
    return p.toString();
  };

  const go = (next: Parameters<typeof query>[0]) => startTransition(() => router.replace(`/admin/report?${query(next)}`, { scroll: false }));

  const limit = mode === "day" ? today : today.slice(0, 7);
  const canNext = period < limit;
  const label = mode === "day" ? formatDayTitle(`${period}T12:00:00Z`) : formatMonthTitle(period);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 rounded-xl bg-slate-200/60 p-1">
        {(["day", "month"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => m !== mode && go({ mode: m })}
            className={`h-9 rounded-[9px] text-sm font-semibold transition ${mode === m ? "bg-white text-ink shadow-[var(--shadow-card)]" : "text-muted"}`}
          >
            {m === "day" ? "Günlük" : "Aylık"}
          </button>
        ))}
      </div>

      <div className="card flex h-14 items-center px-1.5">
        <button type="button" aria-label="Önceki" onClick={() => go({ period: shift(mode, period, -1) })} className="tap flex size-11 items-center justify-center rounded-xl text-body active:bg-app">
          <ChevronLeft className="size-5" />
        </button>
        <div className="relative flex min-w-0 flex-1 items-center justify-center gap-2">
          {pending ? <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" /> : <CalendarDays className="size-4 shrink-0 text-primary" />}
          <span className="truncate text-[15px] font-semibold">{label}</span>
          {mode === "day" && (
            <input
              type="date"
              aria-label="Tarih seç"
              value={period}
              max={today}
              onChange={(e) => e.target.value && go({ period: e.target.value })}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          )}
        </div>
        <button
          type="button"
          aria-label="Sonraki"
          disabled={!canNext}
          onClick={() => go({ period: shift(mode, period, 1) })}
          className="tap flex size-11 items-center justify-center rounded-xl text-body active:bg-app disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="flex gap-3">
        {workplaces.length > 1 && (
          <Select defaultValue={workplaceId ?? ""} onChange={(e) => go({ w: e.target.value })} className="min-w-0 flex-1" aria-label="İşletme">
            <option value="">Tüm işletmeler</option>
            {workplaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        )}
        <a
          href={`/admin/report/export?${query({})}`}
          className={`tap flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-[15px] font-semibold text-white active:bg-emerald-700 ${
            workplaces.length > 1 ? "" : "flex-1"
          }`}
        >
          <Download className="size-[18px]" />
          Excel
        </a>
      </div>
    </div>
  );
}
