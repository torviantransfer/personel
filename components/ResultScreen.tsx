"use client";

import { useEffect, useEffectEvent } from "react";
import { Check, CircleAlert, LoaderCircle, MapPin } from "lucide-react";

export type ResultState =
  | { kind: "loading" }
  | { kind: "success"; variant: "in" | "out"; title: string; subtitle: string; time: string; place?: string | null; detail?: string }
  | { kind: "error"; title: string; description: string; retry?: boolean };

type Props = {
  state: ResultState;
  onDone: () => void;
  onRetry: () => void;
};

const AUTO_CLOSE_MS = 3500;

/** Ana ekranla aynı koyu tema; sonuca göre yeşil (giriş), mavi (çıkış) veya kırmızı (hata) ışıma. */
const THEME = {
  in: { glow: "bg-emerald-500/30", ring: "bg-emerald-400/25", solid: "bg-emerald-500", shadow: "shadow-[0_0_60px_-4px_rgb(16_185_129/0.8)]" },
  out: { glow: "bg-primary/30", ring: "bg-primary/25", solid: "bg-primary", shadow: "shadow-[0_0_60px_-4px_rgb(22_119_255/0.8)]" },
  error: { glow: "bg-rose-500/25", ring: "bg-rose-400/20", solid: "bg-rose-500", shadow: "shadow-[0_0_60px_-4px_rgb(244_63_94/0.7)]" },
  loading: { glow: "bg-primary/20", ring: "bg-primary/15", solid: "bg-primary", shadow: "" },
};

export default function ResultScreen({ state, onDone, onRetry }: Props) {
  const done = useEffectEvent(onDone);

  useEffect(() => {
    if (state.kind !== "success") return;
    const t = setTimeout(() => done(), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [state.kind]);

  const theme = THEME[state.kind === "success" ? state.variant : state.kind];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#070b14] px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] text-white [animation:fade_.2s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
    >
      <div aria-hidden className={`pointer-events-none absolute top-[30%] left-1/2 size-[440px] -translate-x-1/2 rounded-full blur-[120px] ${theme.glow}`} />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        {state.kind === "loading" && (
          <>
            <LoaderCircle className="size-14 animate-spin text-sky-300" />
            <p className="mt-5 text-base font-medium text-white/60">Doğrulanıyor…</p>
          </>
        )}

        {state.kind !== "loading" && (
          <div className="relative flex size-28 items-center justify-center [animation:pop_0.5s_cubic-bezier(.2,.9,.3,1.2)_both]">
            <span className={`absolute inset-0 rounded-full ${theme.ring} [animation:ripple_2.2s_ease-out_infinite]`} />
            <span className={`absolute inset-0 rounded-full ${theme.ring} [animation:ripple_2.2s_ease-out_1.1s_infinite]`} />
            <span className={`relative flex size-24 items-center justify-center rounded-full ${theme.solid} ${theme.shadow}`}>
              {state.kind === "success" ? <Check className="size-12" strokeWidth={3.2} /> : <CircleAlert className="size-12" strokeWidth={2.4} />}
            </span>
          </div>
        )}

        {state.kind === "success" && (
          <>
            <h2 className="mt-9 text-[28px] leading-tight font-bold tracking-tight [animation:rise_.4s_.05s_ease-out_both]">{state.title}</h2>
            <p className="mt-1.5 text-lg font-medium text-white/60 [animation:rise_.4s_.1s_ease-out_both]">{state.subtitle}</p>
            <p className="mt-8 text-6xl font-bold tracking-tight tabular-nums [animation:rise_.4s_.15s_ease-out_both]">{state.time}</p>
            <p className="mt-2 text-[15px] font-medium text-white/50">{state.variant === "in" ? "Giriş saati" : "Çıkış saati"}</p>
            {(state.place || state.detail) && (
              <div className="mt-8 flex flex-wrap justify-center gap-2 [animation:rise_.4s_.2s_ease-out_both]">
                {state.place && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-4 py-2 text-sm font-semibold text-white/85 ring-1 ring-white/10 ring-inset">
                    <MapPin className="size-4 text-sky-300" />
                    {state.place}
                  </span>
                )}
                {state.detail && (
                  <span className="rounded-full bg-white/[0.07] px-4 py-2 text-sm font-semibold text-white/85 ring-1 ring-white/10 ring-inset">{state.detail}</span>
                )}
              </div>
            )}
          </>
        )}

        {state.kind === "error" && (
          <>
            <h2 className="mt-9 text-2xl font-bold tracking-tight [animation:rise_.4s_.05s_ease-out_both]">{state.title}</h2>
            <p className="mt-3 max-w-80 text-[15px] leading-relaxed whitespace-pre-line text-white/60 [animation:rise_.4s_.1s_ease-out_both]">
              {state.description}
            </p>
          </>
        )}
      </div>

      {state.kind !== "loading" && (
        <div className="relative mx-auto flex w-full max-w-md flex-col gap-3 [animation:rise_.4s_.25s_ease-out_both]">
          {state.kind === "error" && state.retry && (
            <button
              type="button"
              onClick={onRetry}
              className="tap h-14 rounded-2xl bg-primary text-base font-semibold shadow-[0_0_40px_-6px_rgb(22_119_255/0.8)] active:bg-primary-dark"
            >
              Tekrar Dene
            </button>
          )}
          <button
            type="button"
            onClick={onDone}
            className="tap h-14 rounded-2xl bg-white/[0.07] text-base font-semibold ring-1 ring-white/10 ring-inset active:bg-white/[0.12]"
          >
            Tamam
          </button>
        </div>
      )}
    </div>
  );
}
