"use client";

import { useFormStatus } from "react-dom";
import { ChevronDown, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import type { ActionState } from "@/app/(app)/admin/actions";

export const inputClass =
  "h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none transition placeholder:text-faint focus:border-primary focus:ring-4 focus:ring-primary/12";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-body">{label}</span>
      {children}
    </label>
  );
}

export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative ${className}`}>
      <select {...props} className={`${inputClass} pr-10`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function Toggle({ name, label, description, defaultChecked }: { name: string; label: string; description?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-app px-4 py-3">
      <span>
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative h-[30px] w-[50px] shrink-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 after:absolute after:top-[3px] after:left-[3px] after:size-6 after:rounded-full after:bg-white after:shadow-md after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export function SubmitButton({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "danger" }) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-primary text-white active:bg-primary-dark",
    secondary: "bg-slate-100 text-ink active:bg-slate-200",
    danger: "bg-rose-600 text-white active:bg-rose-700",
  }[variant];
  return (
    <button
      type="submit"
      disabled={pending}
      className={`tap flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold disabled:opacity-60 ${styles}`}
    >
      {pending ? <LoaderCircle className="size-5 animate-spin" /> : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state?.error && !state?.success) return null;
  const ok = Boolean(state.success);
  return (
    <p
      role="status"
      className={`flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm font-medium [animation:fade_.2s_ease-out] ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {ok ? <CircleCheck className="mt-px size-4 shrink-0" /> : <CircleAlert className="mt-px size-4 shrink-0" />}
      {state.success ?? state.error}
    </p>
  );
}
