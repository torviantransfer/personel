import Link from "next/link";
import { ChevronRight, UserPlus, Users } from "lucide-react";
import PageHeader, { HeaderAction } from "@/components/PageHeader";
import SearchableList from "@/components/admin/SearchableList";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui";
import { formatPhone } from "@/lib/phone";
import { listStaff } from "@/services/admin";

export const metadata = { title: "Personel" };

export default async function StaffListPage() {
  const staff = await listStaff();
  const active = staff.filter((s) => s.active).length;

  return (
    <>
      <PageHeader
        title="Personel"
        subtitle={`${staff.length} kayıt · ${active} aktif`}
        action={
          <HeaderAction href="/admin/staff/new" label="Personel Ekle">
            <UserPlus className="size-4" />
            Ekle
          </HeaderAction>
        }
      />
      <div className="px-5">
        {staff.length === 0 ? (
          <Card>
            <EmptyState icon={Users} title="Kayıtlı personel bulunmuyor" />
          </Card>
        ) : (
          <SearchableList
            placeholder="Ad, telefon veya sicil no"
            items={staff.map((s) => ({
              key: s.id,
              text: `${s.full_name} ${s.phone ?? ""} 0${s.phone ?? ""} ${s.employee_number ?? ""} ${s.workplace_name ?? ""}`,
              content: (
                <Link href={`/admin/staff/${s.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-app">
                  <Avatar name={s.full_name} src={s.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{s.full_name}</p>
                    <p className="truncate text-xs text-muted tabular-nums">{[s.workplace_name, formatPhone(s.phone)].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  {s.role === "admin" && <Badge tone="info">Yönetici</Badge>}
                  {!s.active && <Badge tone="danger">Pasif</Badge>}
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
