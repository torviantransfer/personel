import Link from "next/link";
import { UserCheck, UserX, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ReportFilters from "@/components/admin/ReportFilters";
import { Avatar, Badge, Card, EmptyState, KpiTile, type Tone } from "@/components/ui";
import { requestTime } from "@/lib/attendance";
import { dayKey, formatTime } from "@/lib/format";
import { buildReport, parseReportParams, type ReportRow } from "@/services/report";

export const metadata = { title: "Rapor" };

const th = "px-2 py-3 text-left text-[11px] font-semibold tracking-wide whitespace-nowrap text-muted uppercase sm:px-3";
const td = "px-2 py-3 whitespace-nowrap tabular-nums sm:px-3";
const sticky = "sticky left-0 z-10 bg-white";

export default async function ReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = parseReportParams(await searchParams);
  const { rows, workplaces } = await buildReport(params);
  const present = rows.filter((r) => r.days.length > 0).length;
  const isDay = params.mode === "day";

  return (
    <>
      <PageHeader title="Rapor" />
      <div className="space-y-5 px-5">
        <ReportFilters
          mode={params.mode}
          period={params.period}
          today={dayKey(requestTime())}
          workplaceId={params.workplaceId}
          workplaces={workplaces.map(({ id, name }) => ({ id, name }))}
        />

        <div className="grid grid-cols-3 gap-3">
          <KpiTile icon={Users} tone="info" label="Personel" value={String(rows.length)} />
          <KpiTile icon={UserCheck} tone="success" label={isDay ? "Gelen" : "Çalışan"} value={String(present)} />
          <KpiTile icon={UserX} tone="danger" label={isDay ? "Gelmedi" : "Hiç Gelmedi"} value={String(rows.length - present)} />
        </div>

        <Card className="overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState icon={Users} title="Kayıtlı personel bulunmuyor" />
          ) : (
            <div className="no-scrollbar overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="border-b border-line">
                  <tr>
                    <th className={`${th} ${sticky} !pl-4`}>Personel</th>
                    {isDay ? (
                      <>
                        <th className={th}>Giriş</th>
                        <th className={th}>Çıkış</th>
                        <th className={th}>Durum</th>
                      </>
                    ) : (
                      <>
                        <th className={th}>Geldiği Gün</th>
                        <th className={th}>Çıkış Yapmadığı</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.staff.id}>
                      <NameCell row={r} />
                      {isDay ? <DayCells row={r} /> : <MonthCells row={r} />}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function NameCell({ row }: { row: ReportRow }) {
  return (
    <td className={`${sticky} py-2.5 pr-2 pl-4 sm:pr-3`}>
      <Link href={`/admin/staff/${row.staff.id}`} className="flex max-w-32 items-center gap-2.5 sm:max-w-56">
        <span className="hidden sm:inline-flex">
          <Avatar name={row.staff.full_name} src={row.staff.avatar_url} size="sm" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{row.staff.full_name}</span>
          {row.staff.workplace_name && <span className="block truncate text-xs text-muted">{row.staff.workplace_name}</span>}
        </span>
      </Link>
    </td>
  );
}

function DayCells({ row }: { row: ReportRow }) {
  const d = row.day;
  const status: { label: string; tone: Tone } = !d
    ? { label: "Gelmedi", tone: "danger" }
    : d.open
      ? { label: "Mesaide", tone: "success" }
      : d.lastOut
        ? { label: "Geldi", tone: "info" }
        : { label: "Çıkış yapmadı", tone: "warning" };

  return (
    <>
      <td className={td}>{d ? formatTime(d.firstIn) : <span className="text-faint">--:--</span>}</td>
      <td className={td}>{d?.lastOut && !d.open ? formatTime(d.lastOut) : <span className="text-faint">--:--</span>}</td>
      <td className={`${td} !pr-4`}>
        <Badge tone={status.tone}>
          {status.label}
        </Badge>
      </td>
    </>
  );
}

function MonthCells({ row }: { row: ReportRow }) {
  const n = row.days.length;
  return (
    <>
      <td className={td}>
        <Badge tone={n ? "info" : "neutral"}>{n} gün</Badge>
      </td>
      <td className={`${td} pr-4`}>{row.days.filter((d) => !d.open && !d.lastOut).length}</td>
    </>
  );
}
