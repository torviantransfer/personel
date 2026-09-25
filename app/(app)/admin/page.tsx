import Link from "next/link";
import { BellRing, ChevronRight, LogOut, UserCheck, UserPlus, UserX, Users } from "lucide-react";
import PageHeader, { HeaderAction } from "@/components/PageHeader";
import SearchableList from "@/components/admin/SearchableList";
import { Avatar, Badge, Card, EmptyState, KpiTile, type Tone } from "@/components/ui";
import { requestTime, todaySummary } from "@/lib/attendance";
import { formatShortDay, formatTime } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { getRecordsSince, listStaff, listWorkplaces } from "@/services/admin";

export const metadata = { title: "Bugün" };

type Status = "in" | "out" | "absent";

const STATUS: Record<Status, { label: string; tone: Tone; order: number }> = {
  in: { label: "Mesaide", tone: "success", order: 0 },
  out: { label: "Çıktı", tone: "neutral", order: 1 },
  absent: { label: "Gelmedi", tone: "danger", order: 2 },
};

export default async function AdminTodayPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const { w } = await searchParams;
  const now = requestTime();
  const since = new Date(now - 40 * 60 * 60 * 1000).toISOString();
  const [staff, workplaces, records] = await Promise.all([listStaff(), listWorkplaces(), getRecordsSince(since)]);

  const rows = staff
    .filter((s) => s.active && s.role === "employee" && (!w || s.workplace_id === w))
    .map((s) => {
      const today = todaySummary(records.get(s.id) ?? [], now);
      const status: Status = today.openSession ? "in" : today.sessions.length ? "out" : "absent";
      return { staff: s, today, status };
    })
    .sort((a, b) => STATUS[a.status].order - STATUS[b.status].order || a.staff.full_name.localeCompare(b.staff.full_name, "tr"));

  const count = (st: Status) => rows.filter((r) => r.status === st).length;

  return (
    <>
      <PageHeader
        eyebrow={formatShortDay(now)}
        title="Bugün"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/notify"
              aria-label="Bildirim Gönder"
              className="tap flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-[var(--shadow-card)]"
            >
              <BellRing className="size-[18px]" />
            </Link>
            <HeaderAction href="/admin/staff/new" label="Personel Ekle">
              <UserPlus className="size-4" />
              Ekle
            </HeaderAction>
          </div>
        }
      />
      <div className="space-y-5 px-5">
        <div className="grid grid-cols-3 gap-3">
          <KpiTile icon={UserCheck} tone="success" label="Mesaide" value={String(count("in"))} />
          <KpiTile icon={LogOut} tone="neutral" label="Çıkış Yaptı" value={String(count("out"))} />
          <KpiTile icon={UserX} tone="danger" label="Gelmedi" value={String(count("absent"))} />
        </div>

        {workplaces.length > 1 && (
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            <Chip href="/admin" active={!w}>
              Tümü
            </Chip>
            {workplaces.map((wp) => (
              <Chip key={wp.id} href={`/admin?w=${wp.id}`} active={w === wp.id}>
                {wp.name}
              </Chip>
            ))}
          </div>
        )}

        {rows.length === 0 ? (
          <Card>
            <EmptyState icon={Users} title="Kayıtlı personel bulunmuyor" />
          </Card>
        ) : (
          <SearchableList
            placeholder="Personel ara"
            items={rows.map(({ staff: s, today, status }) => ({
              key: s.id,
              text: `${s.full_name} ${s.phone ?? ""} ${s.employee_number ?? ""}`,
              content: (
                <Link href={`/admin/staff/${s.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-app">
                  <Avatar name={s.full_name} src={s.avatar_url} status={STATUS[status].tone} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{s.full_name}</p>
                    <p className="truncate text-xs text-muted tabular-nums">
                      {status === "absent"
                        ? (!w && s.workplace_name) || formatPhone(s.phone)
                        : `${formatTime(today.firstIn!)} – ${today.lastOut ? formatTime(today.lastOut) : "…"}`}
                    </p>
                  </div>
                  <Badge tone={STATUS[status].tone} dot pulse={status === "in"}>
                    {STATUS[status].label}
                  </Badge>
                  <ChevronRight className="-mr-1 size-4 shrink-0 text-faint" />
                </Link>
              ),
            }))}
          />
        )}
      </div>
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      replace
      scroll={false}
      className={`tap shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold ${active ? "bg-ink text-white" : "bg-white text-body shadow-[var(--shadow-card)]"}`}
    >
      {children}
    </Link>
  );
}
