"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BellRing, LoaderCircle } from "lucide-react";
import { enablePush, pushState, syncPush, type PushState } from "@/lib/push-client";

const noop = () => () => {};

/** İzin verilmemişse "Bildirimleri aç" kartı gösterir; verilmişse aboneliği sessizce tazeler. */
export default function NotificationPrompt() {
  const initial = useSyncExternalStore<PushState>(noop, pushState, () => "unsupported");
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const current = state ?? initial;

  useEffect(() => {
    if (initial === "granted") syncPush();
  }, [initial]);

  if (current !== "default") return null;

  async function enable() {
    setBusy(true);
    setState(await enablePush());
    setBusy(false);
  }

  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 pr-3 ring-1 ring-white/10 backdrop-blur-md ring-inset [animation:rise_.5s_.3s_ease-out_both]">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-sky-300">
        <BellRing className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Bildirimleri açın</p>
        <p className="truncate text-xs text-white/55">Duyurulardan anında haberdar olun</p>
      </div>
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        className="tap flex h-9 min-w-16 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white active:bg-primary-dark disabled:opacity-70"
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : "Aç"}
      </button>
    </div>
  );
}
