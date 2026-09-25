import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: string;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  back?: { href: string; label?: string };
  action?: React.ReactNode;
};

/** Büyük başlıklı sayfa üst alanı (iOS "large title" tarzı). */
export default function PageHeader({ title, subtitle, eyebrow, back, action }: Props) {
  return (
    <header className="safe-top px-5 print:hidden">
      <div className="flex h-12 items-center justify-between">
        {back ? (
          <Link href={back.href} className="tap -ml-2 flex h-10 items-center gap-0.5 rounded-lg pr-3 text-[15px] font-medium text-primary">
            <ChevronLeft className="size-[22px]" strokeWidth={2.2} />
            {back.label ?? "Geri"}
          </Link>
        ) : (
          <span />
        )}
        {action}
      </div>
      <div className="pb-5">
        {eyebrow && <p className="mb-0.5 text-[13px] font-medium text-muted">{eyebrow}</p>}
        <h1 className="text-[28px] leading-tight font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
      </div>
    </header>
  );
}

/** Başlık sağındaki yuvarlak ikon butonu. */
export function HeaderAction({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="tap flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[var(--shadow-cta)] active:bg-primary-dark"
    >
      {children}
    </Link>
  );
}
