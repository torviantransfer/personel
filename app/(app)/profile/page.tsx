import type { Viewport } from "next";
import Link from "next/link";
import { Building2, ChevronLeft, Hash, Phone, ShieldCheck, type LucideIcon } from "lucide-react";
import DarkBackdrop from "@/components/DarkBackdrop";
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
    const active = profile?.active;
    const darkRows = rows.map((r) =>
      r.label === "Hesap Durumu"
        ? {
            ...r,
            value: (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                  active ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25" : "bg-rose-400/10 text-rose-300 ring-rose-400/25"
                }`}
              >
                <span className={`size-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-rose-400"}`} />
                {active ? "Aktif" : "Pasif"}
              </span>
            ),
          }
        : r,
    );
    return <EmployeeProfile name={name} avatarUrl={avatarUrl} rows={darkRows} />;
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

/** Personel profili: ana ekranla aynı koyu tema. */
function EmployeeProfile({
  name,
  avatarUrl,
  rows,
}: {
  name: string;
  avatarUrl: string | null;
  rows: { icon: LucideIcon; label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="app-screen isolate flex flex-col text-white">
      <DarkBackdrop />

      <header className="safe-top px-5">
        <div className="flex h-16 items-center">
          <Link
            href="/"
            className="tap -ml-1 flex h-10 items-center gap-1 rounded-full bg-white/[0.07] pr-4 pl-2.5 text-sm font-semibold text-white/90 ring-1 ring-white/10 ring-inset"
          >
            <ChevronLeft className="size-5" />
            Ana Sayfa
          </Link>
        </div>
      </header>

      <div className="stagger flex flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <section className="flex flex-col items-center pt-4 pb-8 text-center">
          <span className="flex rounded-full p-1 ring-2 ring-primary/50 shadow-[0_0_40px_-4px_rgb(22_119_255/0.55)]">
            <Avatar name={name} src={avatarUrl} size="xl" eager />
          </span>
          <h1 className="mt-5 text-[26px] leading-tight font-bold tracking-tight">{name}</h1>
          <span className="mt-2 rounded-full bg-white/[0.07] px-3 py-1 text-xs font-semibold text-white/70 ring-1 ring-white/10 ring-inset">Personel</span>
        </section>

        <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10 backdrop-blur-md ring-inset">
          {rows.map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex items-center gap-3.5 px-4 py-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-sky-300">
                <Icon className="size-[18px]" />
              </span>
              <span className="flex-1 text-[15px] text-white/60">{label}</span>
              <span className="max-w-[55%] truncate text-right text-[15px] font-semibold">{value}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <LogoutButton dark />
        </div>
      </div>
    </div>
  );
}
