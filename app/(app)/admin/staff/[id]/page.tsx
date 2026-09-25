import { notFound } from "next/navigation";
import { Building2, Phone } from "lucide-react";
import DayList from "@/components/DayList";
import PageHeader from "@/components/PageHeader";
import { DeleteStaffButton, EditStaffForm, ResetPasswordForm } from "@/components/admin/StaffForms";
import AvatarUpload from "@/components/admin/AvatarUpload";
import { Badge, Card, SectionTitle, Stat } from "@/components/ui";
import { buildSessions, groupByDay, requestTime } from "@/lib/attendance";
import { getSession } from "@/lib/auth";
import { dayKey, formatMonthTitle } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { getRecordsSince, getStaff, listWorkplaces } from "@/services/admin";

export const metadata = { title: "Personel" };

const HISTORY_DAYS = 62;

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const now = requestTime();
  const since = new Date(now - HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const [{ userId }, staff, workplaces, records] = await Promise.all([getSession(), getStaff(id), listWorkplaces(), getRecordsSince(since, id)]);
  if (!staff) notFound();

  const todayKey = dayKey(now);
  const monthKey = todayKey.slice(0, 7);
  const days = groupByDay(buildSessions(records.get(id) ?? [], now), now);
  const monthDays = days.filter((d) => d.key.startsWith(monthKey));
  const isSelf = userId === staff.id;
  const options = workplaces.map(({ id, name, active }) => ({ id, name, active }));

  return (
    <>
      <PageHeader back={{ href: "/admin/staff", label: "Personel" }} title={staff.full_name} />
      <div className="space-y-6 px-5">
        <Card className="p-5">
          <AvatarUpload id={staff.id} name={staff.full_name} src={staff.avatar_url} />
          <div className="mt-4 flex flex-col items-center text-center">
            <div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {staff.active ? (
                  <Badge tone="success" dot>
                    Aktif
                  </Badge>
                ) : (
                  <Badge tone="danger" dot>
                    Pasif
                  </Badge>
                )}
                {staff.role === "admin" && <Badge tone="info">Yönetici</Badge>}
                {staff.employee_number && <Badge>Sicil {staff.employee_number}</Badge>}
              </div>
              <p className="mt-2 flex items-center justify-center gap-1.5 truncate text-sm text-body">
                <Building2 className="size-4 shrink-0 text-faint" />
                {staff.workplace_name ?? "İşletme atanmadı"}
              </p>
            </div>
          </div>
          {staff.phone && (
            <a
              href={`tel:+90${staff.phone}`}
              className="tap mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-soft text-[15px] font-semibold text-primary tabular-nums"
            >
              <Phone className="size-4" />
              {formatPhone(staff.phone)}
            </a>
          )}
        </Card>

        <div>
          <SectionTitle>{formatMonthTitle(monthKey)}</SectionTitle>
          <Card className="grid grid-cols-2 divide-x divide-line py-4">
            <div className="px-4">
              <Stat label="Geldiği Gün" value={String(monthDays.length)} accent />
            </div>
            <div className="px-4">
              <Stat label="Çıkış Yapmadığı" value={String(monthDays.filter((d) => !d.open && !d.lastOut).length)} />
            </div>
          </Card>
        </div>

        <DayList days={days} todayKey={todayKey} />

        <div>
          <SectionTitle>Personel Bilgileri</SectionTitle>
          <EditStaffForm staff={staff} workplaces={options} />
        </div>

        <div>
          <SectionTitle>Şifre</SectionTitle>
          <ResetPasswordForm id={staff.id} />
        </div>

        {!isSelf && <DeleteStaffButton id={staff.id} name={staff.full_name} />}
      </div>
    </>
  );
}
