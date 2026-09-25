"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import DarkBackdrop from "@/components/DarkBackdrop";
import { normalizePhone, phoneToEmail } from "@/lib/phone";
import { createClient } from "@/lib/supabase/client";

const fieldClass =
  "peer h-14 w-full rounded-2xl border border-white/10 bg-white/[0.05] pl-12 text-base text-white outline-none transition placeholder:text-white/35 focus:border-primary focus:bg-white/[0.08] focus:ring-4 focus:ring-primary/25";
const iconClass = "pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-white/35 transition-colors peer-focus:text-sky-300";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Geçerli bir telefon numarası giriniz.");
      return;
    }
    setLoading(true);

    try {
      const { error } = await createClient().auth.signInWithPassword({ email: phoneToEmail(normalized), password });
      if (error) {
        setError(/invalid/i.test(error.message) ? "Telefon numarası veya şifre hatalı." : "Giriş yapılamadı. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      router.replace("/");
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate min-h-dvh overflow-hidden text-white">
      <DarkBackdrop />
      <GlowArc position="top" />
      <GlowArc position="bottom" />

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),3.5rem)]">
        <form
          onSubmit={onSubmit}
          noValidate
          className="stagger rounded-[28px] bg-white/[0.06] p-6 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)] ring-1 ring-white/10 backdrop-blur-xl ring-inset [animation:card-in_.7s_.1s_cubic-bezier(.2,.8,.2,1)_both]"
        >
          <div className="mb-7 flex justify-center pt-1">
            <Image src="/brand/mesaigo-white.png" alt="MesaiGo" width={720} height={146} priority className="h-auto w-48" />
          </div>

          <label className="relative block">
            <span className="sr-only">Telefon</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefon numarası"
              className={`${fieldClass} pr-4`}
            />
            <Smartphone className={iconClass} />
          </label>

          <label className="relative mt-3 block">
            <span className="sr-only">Şifre</span>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              autoCapitalize="none"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              className={`${fieldClass} pr-12`}
            />
            <LockKeyhole className={iconClass} />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/45"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </label>

          <div>
            {error && (
              <p
                role="alert"
                className="mt-3 flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300 ring-1 ring-rose-400/20 ring-inset [animation:fade_.2s_ease-out]"
              >
                <CircleAlert className="size-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !phone || !password}
            className={`tap group relative mt-5 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-base font-semibold text-white transition-colors disabled:opacity-50 disabled:shadow-none ${
              success ? "bg-emerald-500" : "bg-primary shadow-[0_0_40px_-6px_rgb(22_119_255/0.8)] active:bg-primary-dark"
            }`}
          >
            {!loading && !success && (
              <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent [animation:shine_2.8s_ease-in-out_1s_infinite]" />
            )}
            {success ? (
              <>
                <LoaderCircle className="size-5 animate-spin" />
                Yönlendiriliyor
              </>
            ) : loading ? (
              <LoaderCircle className="size-6 animate-spin" />
            ) : (
              <>
                Giriş Yap
                <ArrowRight className="size-5 transition-transform group-active:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 pb-[max(env(safe-area-inset-bottom),1.25rem)] text-xs font-medium text-white/40 [animation:fade_1s_.6s_both]">
        <ShieldCheck className="size-4" />
        Güvenli bağlantı
      </p>
    </main>
  );
}

/** Üstte ve altta kıvrımlı, yavaşça nefes alan mavi ışıma (personel ekranındaki QR ışımasıyla aynı dil). */
function GlowArc({ position }: { position: "top" | "bottom" }) {
  const top = position === "top";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute left-1/2 h-[46dvh] w-[170%] -translate-x-1/2 rounded-[50%] [animation:breathe_7s_ease-in-out_infinite] ${
        top
          ? "-top-[24dvh] border-b-2 border-sky-400/40 bg-[radial-gradient(ellipse_at_bottom,rgb(22_119_255/0.75),rgb(22_119_255/0.25)_45%,rgb(22_119_255/0.05)_75%)] shadow-[0_20px_80px_-10px_rgb(22_119_255/0.45)]"
          : "-bottom-[26dvh] border-t-2 border-sky-400/35 bg-[radial-gradient(ellipse_at_top,rgb(22_119_255/0.65),rgb(22_119_255/0.2)_45%,rgb(22_119_255/0.04)_75%)] shadow-[0_-20px_80px_-10px_rgb(22_119_255/0.4)] [animation-delay:-3.5s]"
      }`}
    />
  );
}
