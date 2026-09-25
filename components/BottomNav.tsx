"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutGrid, Table2, UserRound, Users } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Bugün", Icon: LayoutGrid },
  { href: "/admin/report", label: "Rapor", Icon: Table2 },
  { href: "/admin/staff", label: "Personel", Icon: Users },
  { href: "/admin/workplaces", label: "İşletmeler", Icon: Building2 },
  { href: "/profile", label: "Profil", Icon: UserRound },
];

const EXACT = new Set(["/admin"]);

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-white/90 backdrop-blur-xl print:hidden">
      <ul className="mx-auto flex max-w-lg px-2">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = EXACT.has(href) ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                prefetch
                aria-current={active ? "page" : undefined}
                className="flex h-[62px] flex-col items-center justify-center gap-1"
              >
                <span
                  className={`flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-200 ${
                    active ? "bg-primary-soft text-primary" : "text-faint"
                  }`}
                >
                  <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className={`text-[11px] leading-none font-semibold ${active ? "text-primary" : "text-muted"}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
