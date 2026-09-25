"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import type { ActionState } from "@/app/(app)/admin/actions";
import { FormMessage, SubmitButton } from "@/components/admin/Form";

type Props = {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
};

/** Onay gerektiren işlem: alttan açılan pencere (iOS/Android uygulama tarzı). */
export default function ConfirmAction({ action, fields, icon: Icon, label, title, description, confirmLabel, tone = "danger" }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, null);
  const [seen, setSeen] = useState(state);

  // Başarılı sonuç gelince pencereyi kapat (render sırasında durum eşitleme)
  if (state !== seen) {
    setSeen(state);
    if (state?.success) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const danger = tone === "danger";

  return (
    <>
      {state?.success && !open && <FormMessage state={state} />}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`tap flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold ${
          danger ? "bg-rose-50 text-rose-600 active:bg-rose-100" : "bg-slate-100 text-ink active:bg-slate-200"
        }`}
      >
        <Icon className="size-[18px]" />
        {label}
      </button>

      {open &&
        createPortal(
          <div className="h-app fixed inset-x-0 top-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
            <button type="button" aria-label="Kapat" className="absolute inset-0 bg-slate-900/45 [animation:fade_.2s_ease-out]" onClick={() => setOpen(false)} />
            <form
              action={formAction}
              className="relative w-full max-w-md rounded-t-3xl bg-white px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)] [animation:sheet_.28s_cubic-bezier(.2,.9,.3,1)] sm:rounded-3xl sm:pb-6"
            >
              <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
              {Object.entries(fields).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <span className={`flex size-12 items-center justify-center rounded-2xl ${danger ? "bg-rose-50 text-rose-600" : "bg-primary-soft text-primary"}`}>
                <Icon className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{description}</p>
              <div className="mt-4">{state?.error && <FormMessage state={state} />}</div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setOpen(false)} className="tap h-12 rounded-xl bg-slate-100 text-[15px] font-semibold text-ink">
                  Vazgeç
                </button>
                <SubmitButton variant={danger ? "danger" : "primary"}>{confirmLabel}</SubmitButton>
              </div>
            </form>
          </div>,
          document.body,
        )}
    </>
  );
}
