import type { LucideIcon } from "lucide-react";
import { initials } from "@/lib/format";

/* ------------------------------------------------------------------ Badge */

export type Tone = "success" | "danger" | "warning" | "info" | "neutral";

const BADGE: Record<Tone, { box: string; dot: string }> = {
  success: { box: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" },
  danger: { box: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500" },
  warning: { box: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  info: { box: "bg-blue-50 text-blue-700 ring-blue-600/15", dot: "bg-blue-500" },
  neutral: { box: "bg-slate-100 text-slate-600 ring-slate-500/10", dot: "bg-slate-400" },
};

export function Badge({
  tone = "neutral",
  dot = false,
  pulse = false,
  size = "sm",
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  size?: "sm" | "md";
  children: React.ReactNode;
}) {
  const s = BADGE[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ring-1 ring-inset ${s.box} ${
        size === "md" ? "px-3 py-1 text-[13px]" : "px-2 py-0.5 text-[11px]"
      }`}
    >
      {dot && <span className={`size-1.5 rounded-full ${s.dot} ${pulse ? "[animation:pulse-ring_1.6s_ease-out_infinite]" : ""}`} />}
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- Avatar */

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-800",
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
];

const AVATAR_SIZE = { sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-16 text-xl", xl: "size-24 text-3xl" };

export function Avatar({
  name,
  src,
  size = "md",
  status,
  eager = false,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof AVATAR_SIZE;
  status?: Tone;
  /** Ekranın üstündeki fotoğraflar için hemen yükle */
  eager?: boolean;
}) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-bold ${AVATAR_SIZE[size]} ${
        src ? "bg-slate-400/20" : AVATAR_COLORS[h % AVATAR_COLORS.length]
      }`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage'dan küçük, önceden boyutlandırılmış görsel
        <img src={src} alt="" loading={eager ? "eager" : "lazy"} decoding="async" className="size-full rounded-full object-cover" />
      ) : (
        initials(name)
      )}
      {status && <span className={`absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-[2.5px] border-white ${BADGE[status].dot}`} />}
    </span>
  );
}

/* ------------------------------------------------------------ Structure */

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-end justify-between px-1">
      <h2 className="text-[13px] font-semibold tracking-wide text-muted uppercase">{children}</h2>
      {action}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-app text-faint">
        <Icon className="size-7" strokeWidth={1.7} />
      </span>
      <p className="mt-4 text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  );
}

const TILE_TONE: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-600",
  danger: "bg-rose-50 text-rose-600",
  warning: "bg-amber-50 text-amber-600",
  info: "bg-blue-50 text-primary",
  neutral: "bg-slate-100 text-slate-500",
};

export function IconTile({ icon: Icon, tone = "info", size = "md" }: { icon: LucideIcon; tone?: Tone; size?: "sm" | "md" }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl ${TILE_TONE[tone]} ${size === "sm" ? "size-9" : "size-11"}`}>
      <Icon className={size === "sm" ? "size-[18px]" : "size-5"} strokeWidth={2} />
    </span>
  );
}

export function KpiTile({ icon, tone, label, value }: { icon: LucideIcon; tone: Tone; label: string; value: string }) {
  return (
    <div className="card p-3.5">
      <IconTile icon={icon} tone={tone} size="sm" />
      <p className="mt-3 text-[22px] leading-none font-bold tabular-nums">{value}</p>
      <p className="mt-1.5 truncate text-xs font-medium text-muted">{label}</p>
    </div>
  );
}

export function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 truncate text-[17px] font-semibold tabular-nums ${accent ? "text-primary" : "text-ink"}`}>{value}</p>
    </div>
  );
}

/** Takvim yaprağı gibi gün kutusu: "25 / Cum" */
export function DateTile({ day, weekday, highlight }: { day: string; weekday: string; highlight?: boolean }) {
  return (
    <span className={`flex size-12 shrink-0 flex-col items-center justify-center rounded-xl ${highlight ? "bg-primary text-white" : "bg-app text-ink"}`}>
      <span className="text-[17px] leading-none font-bold tabular-nums">{day}</span>
      <span className={`mt-0.5 text-[11px] font-medium ${highlight ? "text-white/80" : "text-muted"}`}>{weekday}</span>
    </span>
  );
}
