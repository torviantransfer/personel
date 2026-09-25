import type { Viewport } from "next";
import { Building2, Hash, Phone, ShieldCheck, type LucideIcon } from "lucide-react";
import EmployeeProfileView from "@/components/EmployeeProfileView";
import LogoutButton from "@/components/LogoutButton";
import PageHeader from "@/components/PageHeader";
import { Avatar, Badge, Card, IconTile, SectionTitle } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getAvatarUrl } from "@/lib/avatars";
import { formatPhone } from "@/lib/phone";

export const metadata = { title: "Profil" };

export async function generateViewport(): Promise<Viewport> {
  const { isAdmin } = await getSession();
  return { themeColor: isAdmin ? "#F5F7FA" : "#070b14" };
}

/** "YUSUF ÇELEBİ" → "Yusuf Çelebi" */
function titleCase(s: string) {
  return s
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
}

export default async function ProfilePage() {
  const { profile, userId, isAdmin } = await getSession();
  const avatarUrl = await getAvatarUrl(userId).catch(() => null);
  const name = titleCase(profile?.full_name || "Personel");

  const rows: { icon: LucideIcon; label: string; value: React.ReactNode }[] = [
    { icon: Phone, label: "Telefon", value: formatPhone(profile?.phone) || "—" },
    { icon: Hash, label: "Sicil No", value: profile?.employee_number || "—" },
    { icon: Building2, label: "İşletme", value: profile?.workplace_name || "—" },
    {
      icon: ShieldCheck,
      label: "Hesap Durumu",
      value: profile?.active ? (
        <Badge tone="success" dot>
          Aktif
        </Badge>
      ) : (
        <Badge tone="danger" dot>
          Pasif
        </Badge>
      ),
    },
  ];

  if (!isAdmin) {
    return (
      <EmployeeProfileView
        data={{
          name,
          avatarUrl,
          phone: formatPhone(profile?.phone),
          employeeNumber: profile?.employee_number ?? null,
          workplaceName: profile?.workplace_name ?? null,
          active: Boolean(profile?.active),
        }}
      />
    );
  }

  return (
    <>
      <PageHeader title="Profil" />
      <div className="space-y-6 px-5">
        <Card className="flex items-center gap-4 p-5">
          <Avatar name={name} src={avatarUrl} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{name}</h2>
            <p className="text-sm text-muted tabular-nums">{formatPhone(profile?.phone)}</p>
            <div className="mt-2">
              <Badge tone="info">Yönetici</Badge>
            </div>
          </div>
        </Card>

        <div>
          <SectionTitle>Hesap Bilgileri</SectionTitle>
          <Card>
            <ul className="divide-y divide-line">
              {rows.map((r) => (
                <li key={r.label} className="flex items-center gap-3.5 px-4 py-3.5">
                  <IconTile icon={r.icon} tone="neutral" size="sm" />
                  <span className="flex-1 text-[15px] text-body">{r.label}</span>
                  <span className="max-w-[55%] truncate text-right text-[15px] font-semibold text-ink">{r.value}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <LogoutButton />
      </div>
    </>
  );
}

