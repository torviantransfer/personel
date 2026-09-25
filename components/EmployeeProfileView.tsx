"use client";

import Link from "next/link";
import { Building2, ChevronLeft, Hash, Phone, ShieldCheck, type LucideIcon } from "lucide-react";
import DarkBackdrop from "@/components/DarkBackdrop";
import LogoutButton from "@/components/LogoutButton";
import { Avatar } from "@/components/ui";

export type EmployeeProfileData = {
  name: string;
  avatarUrl: string | null;
  phone: string;
  employeeNumber: string | null;
  workplaceName: string | null;
  active: boolean;
};

/**
 * Personel profili (koyu tema).
 * onBack verilirse ana ekrandaki anında açılan panel olarak çalışır (sunucu beklenmez);
 * verilmezse /profile sayfasıdır ve geri düğmesi ana sayfaya gider.
 */
export default function EmployeeProfileView({ data, onBack, panel = false }: { data: EmployeeProfileData; onBack?: () => void; panel?: boolean }) {
  const rows: { icon: LucideIcon; label: string; value: React.ReactNode }[] = [
    { icon: Phone, label: "Telefon", value: data.phone || "—" },
    { icon: Hash, label: "Sicil No", value: data.employeeNumber || "—" },
    { icon: Building2, label: "İşletme", value: data.workplaceName || "—" },
    {
      icon: ShieldCheck,
      label: "Hesap Durumu",
      value: (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
            data.active ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25" : "bg-rose-400/10 text-rose-300 ring-rose-400/25"
          }`}
        >
          <span className={`size-1.5 rounded-full ${data.active ? "bg-emerald-400" : "bg-rose-400"}`} />
          {data.active ? "Aktif" : "Pasif"}
        </span>
      ),
    },
  ];

  const backClass =
    "tap -ml-1 flex h-10 items-center gap-1 rounded-full bg-white/[0.07] pr-4 pl-2.5 text-sm font-semibold text-white/90 ring-1 ring-white/10 ring-inset active:bg-white/15";

  return (
    <div
      className={`app-screen isolate flex flex-col text-white ${panel ? "z-40 bg-[#070b14] [animation:slide-in_.28s_cubic-bezier(.2,.8,.2,1)_both]" : ""}`}
      role={panel ? "dialog" : undefined}
      aria-modal={panel || undefined}
      aria-label={panel ? "Profil" : undefined}
    >
      <DarkBackdrop />

      <header className="safe-top px-5">
        <div className="flex h-16 items-center">
          {onBack ? (
            <button type="button" onClick={onBack} className={backClass}>
              <ChevronLeft className="size-5" />
              Ana Sayfa
            </button>
          ) : (
            <Link href="/" className={backClass}>
              <ChevronLeft className="size-5" />
              Ana Sayfa
            </Link>
          )}
        </div>
      </header>

      <div className="stagger flex flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <section className="flex flex-col items-center pt-4 pb-8 text-center">
          <span className="flex rounded-full p-1 shadow-[0_0_40px_-4px_rgb(22_119_255/0.55)] ring-2 ring-primary/50">
            <Avatar name={data.name} src={data.avatarUrl} size="xl" eager />
          </span>
          <h1 className="mt-5 text-[26px] leading-tight font-bold tracking-tight">{data.name}</h1>
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
